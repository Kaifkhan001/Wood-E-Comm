import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { quoteRequests, quoteStatusEnum } from "@/db/schema";
import { Empty, PageHeader, StatusPill, STATUS_LABEL } from "@/components/admin/ui";
import { StatusEditor } from "@/components/admin/status-editor";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Interior quotes" };
export const dynamic = "force-dynamic";

export default async function AdminQuotes({ searchParams }: PageProps<"/admin/quotes">) {
  const sp = await searchParams;
  const status = quoteStatusEnum.enumValues.find((s) => s === sp.status);
  const [rows, counts] = await Promise.all([
    db.select().from(quoteRequests).where(status ? eq(quoteRequests.status, status) : undefined).orderBy(desc(quoteRequests.createdAt)).limit(200),
    db.select({ status: quoteRequests.status, n: count() }).from(quoteRequests).groupBy(quoteRequests.status),
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.n]));

  return (
    <>
      <PageHeader title="Interior quotes" />
      <nav aria-label="Filter by status" className="-mx-1 mb-5 flex flex-wrap gap-1">
        <Link href="/admin/quotes" className={cn("rounded-full px-3 py-1.5 text-sm", !status ? "bg-bottle text-paper" : "hover:bg-ink/5")}>All</Link>
        {quoteStatusEnum.enumValues.map((s) => (
          <Link key={s} href={`/admin/quotes?status=${s}`} className={cn("rounded-full px-3 py-1.5 text-sm", status === s ? "bg-bottle text-paper" : "hover:bg-ink/5")}>
            {STATUS_LABEL[s]} <span className="opacity-60">{byStatus[s] ?? 0}</span>
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <Empty>No quote requests {status ? `marked "${STATUS_LABEL[status]}"` : "yet"}.</Empty>
      ) : (
        <ul className="space-y-3">
          {rows.map((q) => (
            <li key={q.id}>
              <details className="group rounded-lg border border-line bg-white">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{q.name} <span className="font-normal text-muted">, {q.homeSize} {q.propertyType.toLowerCase()} in {q.city}</span></p>
                    <p className="text-sm text-muted">{q.budget}, {q.timeline.toLowerCase()}, received {formatDate(q.createdAt)}</p>
                  </div>
                  <StatusPill status={q.status} />
                </summary>
                <div className="grid gap-6 border-t border-line p-4 lg:grid-cols-[1.3fr_1fr]">
                  <dl className="grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-[110px_1fr]">
                    <dt className="text-muted">Phone</dt>
                    <dd><a href={`tel:+91${q.phone}`} className="underline">{q.phone}</a> <a href={`https://wa.me/91${q.phone}?text=${encodeURIComponent(`Hi ${q.name.split(" ")[0]}, this is Aangan Living about your interior design enquiry.`)}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-[#1f7a4d] underline">WhatsApp</a></dd>
                    {q.email && <><dt className="text-muted">Email</dt><dd><a href={`mailto:${q.email}`} className="underline">{q.email}</a></dd></>}
                    <dt className="text-muted">Scope</dt><dd>{q.scope.join(", ")}</dd>
                    <dt className="text-muted">Budget</dt><dd>{q.budget}</dd>
                    <dt className="text-muted">Timeline</dt><dd>{q.timeline}</dd>
                    {q.message && <><dt className="text-muted">Message</dt><dd className="whitespace-pre-line">{q.message}</dd></>}
                  </dl>
                  <StatusEditor kind="quote" id={q.id} status={q.status} notes={q.adminNotes} statuses={quoteStatusEnum.enumValues} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
