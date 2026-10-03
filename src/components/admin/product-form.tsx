"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { saveProduct } from "@/app/actions/admin";
import { ImageUploader, StockUrlField, type UploaderImg } from "@/components/admin/image-uploader";
import { UPLOAD_FOLDER } from "@/lib/cloudinary-folders";
import { slugify } from "@/lib/utils";
import { SaveBar } from "./save-bar";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes";

type Img = UploaderImg;
export type ProductFormValues = {
  name: string; slug: string; shortDescription: string; description: string; categoryId: string;
  price: string; mrp: string; material: string; color: string; dimensions: string; stock: string;
  isActive: boolean; isFeatured: boolean; images: Img[];
};

export function ProductForm({ id, initial, categories }: { id: string | null; initial: ProductFormValues; categories: { id: string; name: string }[] }) {
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

  const set = <K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) => setV((s) => ({ ...s, [k]: val }));

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
          <ImageUploader
            value={v.images}
            onChange={(images) => set("images", images)}
            folder={UPLOAD_FOLDER}
            max={8}
            altDefault={v.name}
            onUploadingChange={setUploading}
          />
          <StockUrlField onAdd={(url) => setV((s) => ({ ...s, images: [...s.images, { url, alt: s.name }] }))} />
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
        <SaveBar
          dirty={dirty}
          pending={pending || uploading > 0}
          saved={saved}
          creating={!id}
          saveLabel={id ? "Save changes" : "Create product"}
          discardConfirm="Discard your changes to this product?"
          onDiscard={id ? () => setV(baseline) : undefined}
          hint={uploading > 0 ? "Waiting for uploads to finish…" : undefined}
        />
      </div>
    </form>
  );
}
