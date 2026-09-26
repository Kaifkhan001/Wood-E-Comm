import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { assertAdmin } from "@/lib/session";

// Neutralise spreadsheet formula injection in exported cells.
const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

export async function GET() {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
  const csv = ["phone,source,consent,created_at", ...rows.map((r) => [cell(r.phone), cell(r.source), r.consent, r.createdAt.toISOString()].join(","))].join("\n");
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
