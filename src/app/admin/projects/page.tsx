import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { Empty, PageHeader, Table } from "@/components/admin/ui";
import { ProjectRowActions } from "@/components/admin/project-row-actions";
import { AdminImageThumb } from "@/components/admin/image-thumb";
import { cloudinaryUrl } from "@/lib/images";

export const metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

export default async function AdminProjects() {
  const rows = await db.select().from(projects).orderBy(asc(projects.position), asc(projects.title));

  return (
    <>
      <PageHeader title="Projects"><Link href="/admin/projects/new" className="btn-primary">Add project</Link></PageHeader>
      {rows.length === 0 ? (
        <Empty>No projects yet. <Link href="/admin/projects/new" className="text-ink underline">Add your first project</Link>.</Empty>
      ) : (
        <Table>
          <thead><tr><th>Project</th><th>Location</th><th>Home type</th><th>Position</th><th>Published</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-sm bg-cane/30">
                      <AdminImageThumb src={cloudinaryUrl(p.coverUrl, 120, { fit: "cover" })} sizes="64px" className="object-cover" />
                    </div>
                    <Link href={`/admin/projects/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                  </div>
                </td>
                <td>{p.location}</td>
                <td>{p.homeType}</td>
                <td className="tabular-nums">{p.position}</td>
                <td colSpan={2}><ProjectRowActions id={p.id} slug={p.slug} isPublished={p.isPublished} title={p.title} /></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
