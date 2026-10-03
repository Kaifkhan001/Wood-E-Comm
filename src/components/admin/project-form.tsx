"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { saveProject } from "@/app/actions/admin";
import { ImageUploader, StockUrlField, type UploaderImg } from "@/components/admin/image-uploader";
import { PROJECTS_UPLOAD_FOLDER } from "@/lib/cloudinary-folders";
import { slugify } from "@/lib/utils";
import { SaveBar } from "./save-bar";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes";

export type ProjectFormValues = {
  title: string; slug: string; location: string; homeType: string; style: string;
  areaSqft: string; durationWeeks: string; summary: string; isPublished: boolean; position: string;
  images: string[];
};

export function ProjectForm({ id, initial }: { id: string | null; initial: ProjectFormValues }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(0);
  const dirty = JSON.stringify(v) !== JSON.stringify(baseline);
  useUnsavedChangesGuard(dirty);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  const set = <K extends keyof ProjectFormValues>(k: K, val: ProjectFormValues[K]) => setV((s) => ({ ...s, [k]: val }));

  const uploaderImages: UploaderImg[] = v.images.map((url) => ({ url, alt: "" }));
  function setUploaderImages(next: UploaderImg[]) {
    set("images", next.map((i) => i.url).filter((u): u is string => Boolean(u)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    const res = await saveProject(id, {
      ...v,
      areaSqft: v.areaSqft ? Number(v.areaSqft) : null,
      durationWeeks: v.durationWeeks ? Number(v.durationWeeks) : null,
      position: Number(v.position || 0),
    });
    setPending(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
      return;
    }
    toast.success("Project saved");
    if (!id && res.data) router.replace(`/admin/projects/${res.data.id}`);
    else {
      setBaseline(v);
      setSaved(true);
      router.refresh();
    }
  }

  const F = ({ k }: { k: string }) => (errors[k] ? <p className="field-error">{errors[k]}</p> : null);

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        <section className="space-y-4 rounded-lg border border-line bg-white p-5">
          <div>
            <label htmlFor="pr-title" className="label-text">Title</label>
            <input id="pr-title" className="field bg-white" value={v.title} maxLength={120}
              onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />
            <F k="title" />
          </div>
          <div>
            <label htmlFor="pr-slug" className="label-text">URL slug</label>
            <div className="flex items-center rounded-md border border-line bg-white focus-within:border-bottle">
              <span className="pl-3.5 text-sm text-muted">/interior-design/</span>
              <input id="pr-slug" className="w-full bg-transparent py-2.5 pr-3.5 text-[15px] outline-none" value={v.slug} maxLength={80}
                onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
            </div>
            <F k="slug" />
          </div>
          <div>
            <label htmlFor="pr-summary" className="label-text">Summary <span className="font-normal text-muted">(shown on the project page)</span></label>
            <textarea id="pr-summary" rows={6} className="field bg-white" value={v.summary} maxLength={2000} onChange={(e) => set("summary", e.target.value)} />
            <F k="summary" />
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5">
          <F k="images" />
          <ImageUploader
            value={uploaderImages}
            onChange={setUploaderImages}
            folder={PROJECTS_UPLOAD_FOLDER}
            max={12}
            altDefault=""
            showAlt={false}
            onUploadingChange={setUploading}
          />
          <StockUrlField onAdd={(url) => set("images", [...v.images, url])} />
        </section>
      </div>

      <div className="space-y-6">
        <section className="space-y-4 rounded-lg border border-line bg-white p-5">
          <label className="flex items-center justify-between gap-3"><span className="font-medium">Published</span><input type="checkbox" className="h-5 w-5 accent-bottle" checked={v.isPublished} onChange={(e) => set("isPublished", e.target.checked)} /></label>
          <div><label htmlFor="pr-pos" className="label-text">Position <span className="font-normal text-muted">(lower shows first)</span></label><input id="pr-pos" inputMode="numeric" className="field bg-white" value={v.position} onChange={(e) => set("position", e.target.value.replace(/\D/g, ""))} /></div>
        </section>
        <section className="grid grid-cols-2 gap-4 rounded-lg border border-line bg-white p-5">
          <div className="col-span-2"><label htmlFor="pr-loc" className="label-text">Location</label><input id="pr-loc" className="field bg-white" value={v.location} maxLength={80} onChange={(e) => set("location", e.target.value)} placeholder="Andheri West, Mumbai" /><F k="location" /></div>
          <div><label htmlFor="pr-home" className="label-text">Home type</label><input id="pr-home" className="field bg-white" list="home-types" value={v.homeType} maxLength={40} onChange={(e) => set("homeType", e.target.value)} placeholder="2 BHK" /><F k="homeType" />
            <datalist id="home-types">{["1 BHK", "2 BHK", "3 BHK", "4+ BHK", "Villa", "Office"].map((h) => <option key={h} value={h} />)}</datalist>
          </div>
          <div><label htmlFor="pr-style" className="label-text">Style</label><input id="pr-style" className="field bg-white" value={v.style} maxLength={40} onChange={(e) => set("style", e.target.value)} placeholder="Warm minimal" /><F k="style" /></div>
          <div><label htmlFor="pr-area" className="label-text">Area (sq ft)</label><input id="pr-area" inputMode="numeric" className="field bg-white" value={v.areaSqft} onChange={(e) => set("areaSqft", e.target.value.replace(/\D/g, ""))} placeholder="Optional" /></div>
          <div><label htmlFor="pr-dur" className="label-text">Duration (weeks)</label><input id="pr-dur" inputMode="numeric" className="field bg-white" value={v.durationWeeks} onChange={(e) => set("durationWeeks", e.target.value.replace(/\D/g, ""))} placeholder="Optional" /></div>
        </section>
        <SaveBar
          dirty={dirty}
          pending={pending || uploading > 0}
          saved={saved}
          creating={!id}
          saveLabel={id ? "Save changes" : "Create project"}
          discardConfirm="Discard your changes to this project?"
          onDiscard={id ? () => setV(baseline) : undefined}
        />
      </div>
    </form>
  );
}
