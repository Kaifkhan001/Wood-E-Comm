"use server";
import { after } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { contactMessages, leads, orderItems, orders, products, quoteRequests } from "@/db/schema";
import { getCartProducts } from "@/lib/queries/catalog";
import { getSession } from "@/lib/session";
import { checkLimit, clientIp, limiters } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendEmail, notifyOwner, emailShell, escapeHtml, formatIST, customerWhatsappLink } from "@/lib/email";
import { site, whatsappLink } from "@/lib/site";
import { orderNumber } from "@/lib/utils";
import {
  contactSchema,
  leadSchema,
  orderSchema,
  quoteSchema,
  zodErrors,
  type ActionResult,
} from "@/lib/validators";

const GENERIC = "Something went wrong on our side. Please try again, or message us on WhatsApp.";
const LIMITED = "Too many attempts. Please wait a few minutes and try again.";

/** Shared guard for public forms: honeypot, rate limit, bot check. */
async function guard(input: { website?: unknown; turnstileToken?: unknown }) {
  if (typeof input.website === "string" && input.website.length > 0) return "bot";
  const ip = await clientIp();
  if (!(await checkLimit(limiters.form, ip))) return "limited";
  const ok = await verifyTurnstile(typeof input.turnstileToken === "string" ? input.turnstileToken : null, ip);
  return ok ? null : "bot";
}

export async function submitLead(input: unknown): Promise<ActionResult> {
  const raw = (input ?? {}) as Record<string, unknown>;
  const g = await guard(raw);
  if (g === "limited") return { ok: false, error: LIMITED };
  if (g === "bot") return { ok: true }; // silently drop bots
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted field.", fieldErrors: zodErrors(parsed.error) };
  try {
    await db.insert(leads).values({ phone: parsed.data.phone, consent: true }).onConflictDoNothing();
    return { ok: true };
  } catch (e) {
    console.error("submitLead", e);
    return { ok: false, error: GENERIC };
  }
}

export async function submitContact(input: unknown): Promise<ActionResult> {
  const raw = (input ?? {}) as Record<string, unknown>;
  const g = await guard(raw);
  if (g === "limited") return { ok: false, error: LIMITED };
  if (g === "bot") return { ok: true };
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: zodErrors(parsed.error) };
  try {
    await db.insert(contactMessages).values(parsed.data);
    const d = parsed.data;
    after(() =>
      notifyOwner({
        subject: `New message from ${d.name}`,
        text: `${d.name} <${d.email}> ${d.phone}\nReceived ${formatIST(new Date())}\n\n${d.message}`,
        html: emailShell({
          preheader: d.message.slice(0, 100),
          bodyHtml: `
            <p><strong>${escapeHtml(d.name)}</strong> sent a message ${escapeHtml(formatIST(new Date()))}.</p>
            <p>Email: <a href="mailto:${escapeHtml(d.email)}">${escapeHtml(d.email)}</a>${d.phone ? ` &middot; Phone: <a href="tel:+91${escapeHtml(d.phone)}">${escapeHtml(d.phone)}</a>` : ""}</p>
            <p style="white-space:pre-line;border-left:3px solid #eee;padding-left:12px;">${escapeHtml(d.message)}</p>
          `,
          ctaLabel: "View in admin",
          ctaUrl: `${site.url}/admin/messages`,
        }),
        replyTo: d.email || undefined,
      }),
    );
    return { ok: true };
  } catch (e) {
    console.error("submitContact", e);
    return { ok: false, error: GENERIC };
  }
}

export async function submitQuote(input: unknown): Promise<ActionResult> {
  const raw = (input ?? {}) as Record<string, unknown>;
  const g = await guard(raw);
  if (g === "limited") return { ok: false, error: LIMITED };
  if (g === "bot") return { ok: true };
  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: zodErrors(parsed.error) };
  try {
    const session = await getSession();
    await db.insert(quoteRequests).values({ ...parsed.data, userId: session?.user.id ?? null });
    const d = parsed.data;
    const receivedAt = formatIST(new Date());
    const waLink = customerWhatsappLink(d.phone, `Hi ${d.name.split(" ")[0]}, this is Wood & Wonders about your interior design enquiry.`);

    after(() =>
      notifyOwner({
        subject: `New interior quote: ${d.homeSize} ${d.propertyType.toLowerCase()} in ${d.city}`,
        text: `${d.name}, ${d.phone} ${d.email}\nReceived ${receivedAt}\n${d.propertyType}, ${d.homeSize}, ${d.city}\nScope: ${d.scope.join(", ")}\nBudget: ${d.budget}\nTimeline: ${d.timeline}\n\n${d.message}`,
        html: emailShell({
          preheader: `${d.name}, ${d.homeSize} in ${d.city}`,
          bodyHtml: `
            <p><strong>${escapeHtml(d.name)}</strong> requested a quote ${escapeHtml(receivedAt)}.</p>
            <p>
              Phone: <a href="tel:+91${escapeHtml(d.phone)}">${escapeHtml(d.phone)}</a> &middot; <a href="${waLink}">WhatsApp</a><br />
              ${d.email ? `Email: <a href="mailto:${escapeHtml(d.email)}">${escapeHtml(d.email)}</a><br />` : ""}
              City: ${escapeHtml(d.city)}<br />
              Property: ${escapeHtml(d.propertyType)}, ${escapeHtml(d.homeSize)}<br />
              Scope: ${escapeHtml(d.scope.join(", "))}<br />
              Budget: ${escapeHtml(d.budget)}<br />
              Timeline: ${escapeHtml(d.timeline)}
            </p>
            ${d.message ? `<p style="white-space:pre-line;border-left:3px solid #eee;padding-left:12px;">${escapeHtml(d.message)}</p>` : ""}
          `,
          ctaLabel: "View in admin",
          ctaUrl: `${site.url}/admin/quotes`,
        }),
        replyTo: d.email || undefined,
      }),
    );

    if (d.email) {
      after(() =>
        sendEmail({
          to: d.email,
          subject: "We've received your quote request",
          text: `Hi ${d.name},\n\nWe've received your request. A designer will call you within one working day.\n\nQuestions? Message us on WhatsApp: ${whatsappLink("Hi Wood & Wonders, following up on my quote request.")}`,
          html: emailShell({
            bodyHtml: `
              <p>Hi ${escapeHtml(d.name)},</p>
              <p>We've received your request. A designer will call you within one working day with ideas and a budget estimate.</p>
              <p>In a hurry? Message us directly on WhatsApp.</p>
            `,
            ctaLabel: "Chat on WhatsApp",
            ctaUrl: whatsappLink("Hi Wood & Wonders, following up on my quote request."),
          }),
        }),
      );
    }

    return { ok: true };
  } catch (e) {
    console.error("submitQuote", e);
    return { ok: false, error: GENERIC };
  }
}

/** Public cart details. Returns only public product fields. */
export async function getCartDetails(ids: unknown) {
  if (!Array.isArray(ids)) return [];
  const clean = ids.filter((x): x is string => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x)).slice(0, 30);
  return getCartProducts(clean);
}

/**
 * Creates an order request. The user id comes from the verified session, never
 * from the client, and every price is re-read from the database.
 */
export async function placeOrder(input: unknown): Promise<ActionResult<{ orderId: string; number: string }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Please sign in to place your order." };
  if (!(await checkLimit(limiters.order, session.user.id))) return { ok: false, error: LIMITED };

  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: zodErrors(parsed.error) };
  const data = parsed.data;

  // Merge duplicate lines
  const qty = new Map<string, number>();
  for (const it of data.items) qty.set(it.productId, Math.min(10, (qty.get(it.productId) ?? 0) + it.quantity));

  try {
    const result = await db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: products.id, name: products.name, price: products.price, stock: products.stock })
        .from(products)
        .where(and(inArray(products.id, [...qty.keys()]), eq(products.isActive, true)))
        .for("update");

      if (rows.length !== qty.size) return { error: "Some items in your cart are no longer available. Please review your cart." } as const;
      const short = rows.find((r) => r.stock < (qty.get(r.id) ?? 0));
      if (short) return { error: short.stock === 0 ? `"${short.name}" is out of stock. Remove it from your cart to continue.` : `Only ${short.stock} of "${short.name}" left in stock. Please update your cart.` } as const;

      const subtotal = rows.reduce((sum, r) => sum + r.price * (qty.get(r.id) ?? 0), 0);
      const [order] = await tx
        .insert(orders)
        .values({
          userId: session.user.id,
          email: session.user.email,
          customerName: data.customerName,
          phone: data.phone,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          notes: data.notes,
          subtotal,
        })
        .returning({ id: orders.id, number: orders.number });

      await tx.insert(orderItems).values(
        rows.map((r) => ({ orderId: order.id, productId: r.id, productName: r.name, unitPrice: r.price, quantity: qty.get(r.id)! })),
      );
      return { order, subtotal } as const;
    });

    if ("error" in result) return { ok: false, error: result.error! };
    const num = orderNumber(result.order.number);
    const receivedAt = formatIST(new Date());
    const waLink = customerWhatsappLink(data.phone, `Hi ${data.customerName.split(" ")[0]}, this is Wood & Wonders about your order ${num}.`);
    after(() =>
      notifyOwner({
        subject: `New order request ${num}`,
        text: `${data.customerName}, ${data.phone}\nReceived ${receivedAt}\n${data.city}, ${data.pincode}\nSubtotal: ₹${result.subtotal}`,
        html: emailShell({
          preheader: `${num}, ₹${result.subtotal}`,
          bodyHtml: `
            <p><strong>${escapeHtml(data.customerName)}</strong> placed order <strong>${escapeHtml(num)}</strong> ${escapeHtml(receivedAt)}.</p>
            <p>
              Phone: <a href="tel:+91${escapeHtml(data.phone)}">${escapeHtml(data.phone)}</a> &middot; <a href="${waLink}">WhatsApp</a><br />
              Email: <a href="mailto:${escapeHtml(session.user.email)}">${escapeHtml(session.user.email)}</a><br />
              Delivery: ${escapeHtml(data.addressLine1)}${data.addressLine2 ? `, ${escapeHtml(data.addressLine2)}` : ""}, ${escapeHtml(data.city)}, ${escapeHtml(data.state)} ${escapeHtml(data.pincode)}<br />
              Subtotal: ₹${result.subtotal.toLocaleString("en-IN")}
            </p>
            ${data.notes ? `<p style="white-space:pre-line;border-left:3px solid #eee;padding-left:12px;">${escapeHtml(data.notes)}</p>` : ""}
          `,
          ctaLabel: "View order",
          ctaUrl: `${site.url}/admin/orders/${result.order.id}`,
        }),
        replyTo: session.user.email,
      }),
    );
    revalidatePath("/account");
    return { ok: true, data: { orderId: result.order.id, number: num } };
  } catch (e) {
    console.error("placeOrder", e);
    return { ok: false, error: GENERIC };
  }
}
