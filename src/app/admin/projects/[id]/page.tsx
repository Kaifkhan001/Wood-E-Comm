import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { PageHeader } from "@/components/admin/ui";
import { ProjectForm } from "@/components/admin/project-form";

export const metadata = { title: "Edit project" };
export const dynamic = "force-dynamic";

export default async function EditProject({ params }: PageProps<"/admin/projects/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const p = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!p) notFound();
  return (
    <>
      <PageHeader title={p.title} />
      <ProjectForm
        id={p.id}
        initial={{
          title: p.title, slug: p.slug, location: p.location, homeType: p.homeType, style: p.style,
          areaSqft: p.areaSqft ? String(p.areaSqft) : "", durationWeeks: p.durationWeeks ? String(p.durationWeeks) : "",
          summary: p.summary, isPublished: p.isPublished, position: String(p.position), images: p.gallery,
        }}
      />
    </>
  );
}
