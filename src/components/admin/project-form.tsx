"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { saveProject } from "@/app/actions/admin";
import { SmartImage } from "@/components/ui/smart-image";
import { PROJECTS_UPLOAD_FOLDER } from "@/lib/cloudinary-folders";
import { slugify } from "@/lib/utils";

export type ProjectFormValues = {
  title: string; slug: string; location: string; homeType: string; style: string;
  areaSqft: string; durationWeeks: string; summary: string; isPublished: boolean; position: string;
  images: string[];
};

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function ProjectForm({ id, initial }: { id: string | null; initial: ProjectFormValues }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ProjectFormValues>(k: K, val: ProjectFormValues[K]) => setV((s) => ({ ...s, [k]: val }));

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files).slice(0, 12 - v.images.length)) {
      if (!TYPES.includes(file.type)) { toast.error(`${file.name}: use JPG, PNG, WebP or AVIF.`); continue; }
      if (file.size > MAX_BYTES) { toast.error(`${file.name} is larger than 8 MB.`); continue; }
      setUploading((n) => n + 1);
      try {
        const sigRes = await fetch("/api/admin/upload-signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: PROJECTS_UPLOAD_FOLDER }),
        });
        const sig = await sigRes.json();
        if (!sigRes.ok) throw new Error(sig.error || "Upload not allowed");
        const body = new FormData();
        body.append("file", file);
        for (const k of ["api_key", "timestamp", "signature", "folder", "allowed_formats", "transformation"]) body.append(k, String(sig[k]));
        const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, { method: "POST", body });
        const data = await up.json();
        if (!up.ok) throw new Error(data?.error?.message || "Upload failed");
        const url = `https://res.cloudinary.com/${sig.cloud_name}/image/upload/f_auto,q_auto,c_limit,w_1600/${data.public_id}.${data.format}`;
        setV((s) => ({ ...s, images: [...s.images, url] }));
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function move(i: number, dir: -1 | 1) {
    setV((s) => {
      const imgs = [...s.images];
      const j = i + dir;
      if (j < 0 || j >= imgs.length) return s;
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
      return { ...s, images: imgs };
    });
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
    else router.refresh();
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
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-base font-semibold">Images</h2>
            <span className="text-sm text-muted">{v.images.length}/12, first image is the cover</span>
          </div>
          <F k="images" />
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {v.images.map((url, i) => (
              <li key={url + i} className="rounded-md border border-line p-2">
                <div className="relative aspect-square overflow-hidden rounded-sm bg-cane/30">
                  <SmartImage src={url} alt="" fill sizes="150px" className="object-cover" />
                  {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-paper px-1.5 py-0.5 text-[10px] font-medium">Cover</span>}
                </div>
                <div className="mt-1.5 flex justify-between">
                  <div className="flex">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 disabled:opacity-30" aria-label="Move earlier"><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === v.images.length - 1} className="p-1.5 disabled:opacity-30" aria-label="Move later"><ArrowDown className="h-4 w-4" /></button>
                  </div>
                  <button type="button" onClick={() => setV((s) => ({ ...s, images: s.images.filter((_, j) => j !== i) }))} className="p-1.5 text-danger" aria-label="Remove image"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
            {v.images.length < 12 && (
              <li>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading > 0}
                  className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-line text-sm text-muted hover:border-bottle hover:text-bottle">
                  <ImagePlus className="h-6 w-6" />{uploading ? `Uploading ${uploading}…` : "Upload images"}
                </button>
                <input ref={fileRef} type="file" accept={TYPES.join(",")} multiple hidden onChange={(e) => upload(e.target.files)} />
              </li>
            )}
          </ul>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-muted">Add a stock image by URL (Unsplash or Cloudinary)</summary>
            <div className="mt-2 flex gap-2">
              <input className="field bg-white" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://images.unsplash.com/…" />
              <button type="button" className="btn-outline" onClick={() => {
                if (!/^https:\/\/(images\.unsplash\.com|res\.cloudinary\.com)\//.test(urlInput)) return toast.error("Only Unsplash or Cloudinary URLs are allowed.");
                setV((s) => ({ ...s, images: [...s.images, urlInput] }));
                setUrlInput("");
              }}>Add</button>
            </div>
          </details>
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
        <button type="submit" className="btn-primary w-full" disabled={pending || uploading > 0}>{pending ? "Saving…" : id ? "Save changes" : "Create project"}</button>
      </div>
    </form>
  );
}
