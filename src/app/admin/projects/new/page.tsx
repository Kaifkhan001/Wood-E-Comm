import { PageHeader } from "@/components/admin/ui";
import { ProjectForm } from "@/components/admin/project-form";

export const metadata = { title: "Add project" };

export default function NewProject() {
  return (
    <>
      <PageHeader title="Add project" />
      <ProjectForm
        id={null}
        initial={{ title: "", slug: "", location: "", homeType: "", style: "", areaSqft: "", durationWeeks: "", summary: "", isPublished: true, position: "0", images: [] }}
      />
    </>
  );
}
