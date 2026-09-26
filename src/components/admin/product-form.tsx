"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { saveProduct } from "@/app/actions/admin";
import { SmartImage } from "@/components/ui/smart-image";
import { imageSrc } from "@/lib/images";
import { slugify } from "@/lib/utils";

type Img = { publicId?: string | null; url?: string | null; alt: string };
export type ProductFormValues = {
  name: string; slug: string; shortDescription: string; description: string; categoryId: string;
  price: string; mrp: string; material: string; color: string; dimensions: string; stock: string;
  isActive: boolean; isFeatured: boolean; images: Img[];
};

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function ProductForm({ id, initial, categories }: { id: string | null; initial: ProductFormValues; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) => setV((s) => ({ ...s, [k]: val }));

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files).slice(0, 8 - v.images.length)) {
      if (!TYPES.includes(file.type)) { toast.error(`${file.name}: use JPG, PNG, WebP or AVIF.`); continue; }
      if (file.size > MAX_BYTES) { toast.error(`${file.name} is larger than 8 MB.`); continue; }
      setUploading((n) => n + 1);
      try {
        const sigRes = await fetch("/api/admin/upload-signature", { method: "POST" });
        const sig = await sigRes.json();
        if (!sigRes.ok) throw new Error(sig.error || "Upload not allowed");
        const body = new FormData();
        body.append("file", file);
        for (const k of ["api_key", "timestamp", "signature", "folder", "allowed_formats", "transformation"]) body.append(k, String(sig[k]));
        const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, { method: "POST", body });
        const data = await up.json();
        if (!up.ok) throw new Error(data?.error?.message || "Upload failed");
        setV((s) => ({ ...s, images: [...s.images, { publicId: data.public_id, alt: s.name }] }));
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
    const res = await saveProduct(id, {
      ...v,
      price: Number(v.price),
      mrp: v.mrp ? Number(v.mrp) : null,
      stock: Number(v.stock || 0),
      images: v.images.map((i) => ({ publicId: i.publicId ?? null, url: i.url ?? null, alt: i.alt })),
    });
    setPending(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
      return;
    }
    toast.success("Product saved");
    if (!id && res.data) router.replace(`/admin/products/${res.data.id}`);
    else router.refresh();
  }

  const F = ({ k }: { k: string }) => (errors[k] ? <p className="field-error">{errors[k]}</p> : null);

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        <section className="space-y-4 rounded-lg border border-line bg-white p-5">
          <div>
            <label htmlFor="p-name" className="label-text">Name</label>
            <input id="p-name" className="field bg-white" value={v.name} maxLength={120}
              onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />
            <F k="name" />
          </div>
          <div>
            <label htmlFor="p-slug" className="label-text">URL slug</label>
            <div className="flex items-center rounded-md border border-line bg-white focus-within:border-bottle">
              <span className="pl-3.5 text-sm text-muted">/product/</span>
              <input id="p-slug" className="w-full bg-transparent py-2.5 pr-3.5 text-[15px] outline-none" value={v.slug} maxLength={80}
                onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
            </div>
            <F k="slug" />
          </div>
          <div>
            <label htmlFor="p-short" className="label-text">Short description <span className="font-normal text-muted">(shown in listings and search results)</span></label>
            <input id="p-short" className="field bg-white" value={v.shortDescription} maxLength={200} onChange={(e) => set("shortDescription", e.target.value)} />
          </div>
          <div>
            <label htmlFor="p-desc" className="label-text">Full description <span className="font-normal text-muted">(blank line starts a new paragraph)</span></label>
            <textarea id="p-desc" rows={8} className="field bg-white" value={v.description} maxLength={5000} onChange={(e) => set("description", e.target.value)} />
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-base font-semibold">Images</h2>
            <span className="text-sm text-muted">{v.images.length}/8, first image is the cover</span>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {v.images.map((img, i) => (
              <li key={(img.publicId ?? img.url ?? "") + i} className="rounded-md border border-line p-2">
                <div className="relative aspect-square overflow-hidden rounded-sm bg-cane/30">
                  <SmartImage src={imageSrc(img, 300)} alt="" fill sizes="150px" className="object-cover" />
                </div>
                <input aria-label={`Alt text for image ${i + 1}`} className="mt-2 w-full rounded border border-line px-2 py-1 text-xs" placeholder="Describe the image" value={img.alt} maxLength={160}
                  onChange={(e) => setV((s) => ({ ...s, images: s.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)) }))} />
                <div className="mt-1.5 flex justify-between">
                  <div className="flex">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 disabled:opacity-30" aria-label="Move earlier"><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === v.images.length - 1} className="p-1.5 disabled:opacity-30" aria-label="Move later"><ArrowDown className="h-4 w-4" /></button>
                  </div>
                  <button type="button" onClick={() => setV((s) => ({ ...s, images: s.images.filter((_, j) => j !== i) }))} className="p-1.5 text-danger" aria-label="Remove image"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
            {v.images.length < 8 && (
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
                setV((s) => ({ ...s, images: [...s.images, { url: urlInput, alt: s.name }] }));
                setUrlInput("");
              }}>Add</button>
            </div>
          </details>
        </section>
      </div>

      <div className="space-y-6">
        <section className="space-y-4 rounded-lg border border-line bg-white p-5">
          <label className="flex items-center justify-between gap-3"><span className="font-medium">Visible in store</span><input type="checkbox" className="h-5 w-5 accent-bottle" checked={v.isActive} onChange={(e) => set("isActive", e.target.checked)} /></label>
          <label className="flex items-center justify-between gap-3"><span className="font-medium">Featured on homepage</span><input type="checkbox" className="h-5 w-5 accent-bottle" checked={v.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} /></label>
        </section>
        <section className="grid grid-cols-2 gap-4 rounded-lg border border-line bg-white p-5">
          <div><label htmlFor="p-price" className="label-text">Price (₹)</label><input id="p-price" inputMode="numeric" className="field bg-white" value={v.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} /><F k="price" /></div>
          <div><label htmlFor="p-mrp" className="label-text">MRP (₹)</label><input id="p-mrp" inputMode="numeric" className="field bg-white" value={v.mrp} onChange={(e) => set("mrp", e.target.value.replace(/\D/g, ""))} placeholder="Optional" /><F k="mrp" /></div>
          <div><label htmlFor="p-stock" className="label-text">Stock</label><input id="p-stock" inputMode="numeric" className="field bg-white" value={v.stock} onChange={(e) => set("stock", e.target.value.replace(/\D/g, ""))} /><F k="stock" /></div>
          <div>
            <label htmlFor="p-cat" className="label-text">Category</label>
            <select id="p-cat" className="field bg-white" value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">Choose…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <F k="categoryId" />
          </div>
        </section>
        <section className="space-y-4 rounded-lg border border-line bg-white p-5">
          <div><label htmlFor="p-mat" className="label-text">Material <span className="font-normal text-muted">(used for filters)</span></label><input id="p-mat" className="field bg-white" list="materials" value={v.material} maxLength={40} onChange={(e) => set("material", e.target.value)} /><F k="material" />
            <datalist id="materials">{["Sheesham wood", "Teak wood", "Mango wood", "Engineered wood", "Cane & rattan"].map((m) => <option key={m} value={m} />)}</datalist>
          </div>
          <div><label htmlFor="p-color" className="label-text">Finish or colour</label><input id="p-color" className="field bg-white" value={v.color} maxLength={40} onChange={(e) => set("color", e.target.value)} /></div>
          <div><label htmlFor="p-dim" className="label-text">Dimensions</label><input id="p-dim" className="field bg-white" value={v.dimensions} maxLength={120} onChange={(e) => set("dimensions", e.target.value)} placeholder="W 198 × D 86 × H 82 cm" /></div>
        </section>
        <button type="submit" className="btn-primary w-full" disabled={pending || uploading > 0}>{pending ? "Saving…" : id ? "Save changes" : "Create product"}</button>
      </div>
    </form>
  );
}
