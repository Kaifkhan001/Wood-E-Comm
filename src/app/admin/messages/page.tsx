import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages, leads } from "@/db/schema";
import { CardField, CardList, CardRow, Empty, PageHeader, Table } from "@/components/admin/ui";
import { ResolveButton } from "@/components/admin/message-actions";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Messages and leads" };
export const dynamic = "force-dynamic";

export default async function AdminMessages({ searchParams }: PageProps<"/admin/messages">) {
  const sp = await searchParams;
  const tab = sp.tab === "leads" ? "leads" : sp.tab === "replied" ? "replied" : "open";

  const tabs = [
    { key: "open", label: "Open messages", href: "/admin/messages" },
    { key: "replied", label: "Replied", href: "/admin/messages?tab=replied" },
    { key: "leads", label: "Offer sign-ups", href: "/admin/messages?tab=leads" },
  ];

  return (
    <>
      <PageHeader title="Messages and leads">
        {tab === "leads" && <a href="/api/admin/leads" className="btn-outline">Download CSV</a>}
      </PageHeader>
      <nav aria-label="Sections" className="-mx-1 mb-5 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
        {tabs.map((t) => (
          <Link key={t.key} href={t.href} aria-current={tab === t.key ? "page" : undefined} className={cn("shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm", tab === t.key ? "bg-bottle text-paper" : "hover:bg-ink/5")}>{t.label}</Link>
        ))}
      </nav>
      {tab === "leads" ? <Leads /> : <Messages resolved={tab === "replied"} />}
    </>
  );
}

async function Messages({ resolved }: { resolved: boolean }) {
  const rows = await db.select().from(contactMessages).where(eq(contactMessages.isResolved, resolved)).orderBy(desc(contactMessages.createdAt)).limit(200);
  if (!rows.length) return <Empty>{resolved ? "No replied messages." : "Inbox zero. New contact-form messages will appear here."}</Empty>;
  return (
    <ul className="space-y-3">
      {rows.map((m) => (
        <li key={m.id} className="rounded-lg border border-line bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-sm text-muted">
                <a href={`mailto:${m.email}`} className="underline">{m.email}</a>
                {m.phone && <> , <a href={`tel:+91${m.phone}`} className="underline">{m.phone}</a></>}
                , {formatDate(m.createdAt)}
              </p>
            </div>
            <ResolveButton id={m.id} resolved={m.isResolved} />
          </div>
          <p className="mt-3 whitespace-pre-line text-[15px]">{m.message}</p>
        </li>
      ))}
    </ul>
  );
}

async function Leads() {
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(500);
  if (!rows.length) return <Empty>No offer sign-ups yet. They come from the discount popup.</Empty>;
  return (
    <>
      <CardList className="md:hidden">
        {rows.map((l) => (
          <CardRow key={l.id}>
            <a href={`https://wa.me/91${l.phone}`} target="_blank" rel="noopener noreferrer" className="relative z-10 font-medium hover:underline">{l.phone}</a>
            <CardField label="Source">{l.source === "discount_popup" ? "Discount popup" : l.source}</CardField>
            <CardField label="Consent">{l.consent ? "Yes" : "No"}</CardField>
            <CardField label="Signed up">{formatDate(l.createdAt)}</CardField>
          </CardRow>
        ))}
      </CardList>
      <Table className="hidden md:block">
        <thead><tr><th>Mobile</th><th>Source</th><th>Consent</th><th>Signed up</th></tr></thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id}>
              <td><a href={`https://wa.me/91${l.phone}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{l.phone}</a></td>
              <td>{l.source === "discount_popup" ? "Discount popup" : l.source}</td>
              <td>{l.consent ? "Yes" : "No"}</td>
              <td>{formatDate(l.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
