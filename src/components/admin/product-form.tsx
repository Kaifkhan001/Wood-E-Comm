"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { saveProduct, saveSubcategory } from "@/app/actions/admin";
import { ImageUploader, StockUrlField, type UploaderImg } from "@/components/admin/image-uploader";
import { SlugField } from "@/components/admin/slug-field";
import { MaterialCombobox } from "@/components/admin/material-combobox";
import { SpecsEditor, type SpecsValue } from "@/components/admin/specs-editor";
import { HighlightsEditor } from "@/components/admin/highlights-editor";
import { ASSEMBLY_OPTIONS } from "@/lib/catalog-options";
import { UPLOAD_FOLDER } from "@/lib/cloudinary-folders";
import { slugify } from "@/lib/utils";
import { SaveBar } from "./save-bar";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes";

type Img = UploaderImg;
export type ProductFormValues = {
  name: string; slug: string; shortDescription: string; description: string; categoryId: string; subcategoryId: string;
  price: string; mrp: string; material: string; color: string; dimensions: string; stock: string;
  isActive: boolean; isFeatured: boolean; images: Img[];
  brand: string; sku: string; widthCm: string; depthCm: string; heightCm: string; weightKg: string;
  assembly: string; warrantyMonths: string; countryOfOrigin: string;
  highlights: string[]; specs: SpecsValue;
};

type Subcat = { id: string; categoryId: string; name: string; slug: string };

export function ProductForm({
  id,
  initial,
  categories,
  subcategories,
}: {
  id: string | null;
  initial: ProductFormValues;
  categories: { id: string; name: string; slug: string }[];
  subcategories: Subcat[];
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [subcats, setSubcats] = useState(subcategories);
  const [addingSubcat, setAddingSubcat] = useState(false);
  const [newSubcatName, setNewSubcatName] = useState("");
  const [subcatPending, setSubcatPending] = useState(false);
  const dirty = JSON.stringify(v) !== JSON.stringify(baseline);
  useUnsavedChangesGuard(dirty);
  const subcatsForCategory = subcats.filter((s) => s.categoryId === v.categoryId);

  async function addSubcategory() {
    const name = newSubcatName.trim();
    if (name.length < 2 || !v.categoryId) return;
    setSubcatPending(true);
    const res = await saveSubcategory(null, { categoryId: v.categoryId, name, slug: slugify(name), position: subcatsForCategory.length });
    setSubcatPending(false);
    if (!res.ok) { toast.error(res.error); return; }
    if (res.data) {
      setSubcats((s) => [...s, { id: res.data!.id, categoryId: v.categoryId, name, slug: res.data!.slug }]);
      set("subcategoryId", res.data.id);
    }
    setNewSubcatName("");
    setAddingSubcat(false);
    router.refresh();
  }

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
      images: v.images.map((i) => ({ publicId: i.publicId ?? null, url: i.url ?? null, alt: i.alt, fit: i.fit ?? "contain" })),
      sku: v.sku || null,
      widthCm: v.widthCm || null,
      depthCm: v.depthCm || null,
      heightCm: v.heightCm || null,
      weightKg: v.weightKg || null,
      assembly: v.assembly || null,
      warrantyMonths: v.warrantyMonths ? Number(v.warrantyMonths) : null,
      subcategoryId: v.subcategoryId || null,
    });
    setPending(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
      return;
    }
    toast.success(res.message ?? "Product saved");
    const finalV = res.data?.slug ? { ...v, slug: res.data.slug } : v;
    if (!id && res.data) router.replace(`/admin/products/${res.data.id}`);
    else {
      setV(finalV);
      setBaseline(finalV);
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
            <SlugField
              value={v.slug}
              onChange={(s) => { setSlugTouched(true); set("slug", s); }}
              prefix="/product/"
              hint={id ? "URL stays the same. Edit it only if needed." : undefined}
            />
            <F k="slug" />
          </div>
          <div>
            <label htmlFor="p-short" className="label-text">Short description <span className="font-normal text-muted">(shown in listings and search results)</span></label>
            <input id="p-short" className="field bg-white" value={v.shortDescription} maxLength={200} onChange={(e) => set("shortDescription", e.target.value)} />
          </div>
          <div>
            <label htmlFor="p-desc" className="label-text">Full description <span className="font-normal text-muted">(blank line starts a new paragraph)</span></label>
            <textarea id="p-desc" rows={8} className="field bg-white" value={v.description} maxLength={5000} onChange={(e) => set("description", e.target.value)} />
            <p className="mt-1.5 text-xs text-muted">Write this in your own words. Copying text from Amazon or other sites can hurt Google ranking.</p>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5">
          <HighlightsEditor value={v.highlights} onChange={(highlights) => set("highlights", highlights)} />
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
            <select id="p-cat" className="field bg-white" value={v.categoryId} onChange={(e) => setV((s) => ({ ...s, categoryId: e.target.value, subcategoryId: "" }))}>
              <option value="">Choose…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <F k="categoryId" />
          </div>
          <div>
            <label htmlFor="p-subcat" className="label-text">Subcategory <span className="font-normal text-muted">(optional)</span></label>
            <select id="p-subcat" className="field bg-white" value={v.subcategoryId} disabled={!v.categoryId} onChange={(e) => set("subcategoryId", e.target.value)}>
              <option value="">None</option>
              {subcatsForCategory.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {addingSubcat ? (
              <div className="mt-2 flex gap-2">
                <input
                  className="field bg-white text-sm"
                  placeholder="New subcategory name"
                  value={newSubcatName}
                  maxLength={60}
                  autoFocus
                  onChange={(e) => setNewSubcatName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void addSubcategory(); } }}
                />
                <button type="button" className="btn-primary px-3 py-1.5 text-sm" disabled={subcatPending || newSubcatName.trim().length < 2} onClick={addSubcategory}>Add</button>
                <button type="button" className="btn-outline px-3 py-1.5 text-sm" onClick={() => { setAddingSubcat(false); setNewSubcatName(""); }}>Cancel</button>
              </div>
            ) : (
              <button type="button" disabled={!v.categoryId} className="mt-1.5 flex items-center gap-1 text-sm font-medium text-bottle hover:underline disabled:opacity-40" onClick={() => setAddingSubcat(true)}>
                <Plus className="h-3.5 w-3.5" /> Add subcategory
              </button>
            )}
          </div>
        </section>
        <section className="space-y-4 rounded-lg border border-line bg-white p-5">
          <div><label htmlFor="p-mat" className="label-text">Material <span className="font-normal text-muted">(used for filters)</span></label><MaterialCombobox id="p-mat" value={v.material} onChange={(m) => set("material", m)} /><F k="material" /></div>
          <div><label htmlFor="p-color" className="label-text">Finish or colour</label><input id="p-color" className="field bg-white" value={v.color} maxLength={40} onChange={(e) => set("color", e.target.value)} /></div>
          <div><label htmlFor="p-dim" className="label-text">Dimensions <span className="font-normal text-muted">(fallback text, used if W/D/H below are blank)</span></label><input id="p-dim" className="field bg-white" value={v.dimensions} maxLength={120} onChange={(e) => set("dimensions", e.target.value)} placeholder="W 198 × D 86 × H 82 cm" /></div>
        </section>

        <details className="group rounded-lg border border-line bg-white p-5">
          <summary className="cursor-pointer list-none font-sans text-base font-semibold [&::-webkit-details-marker]:hidden">
            Specifications <span className="font-normal text-muted group-open:hidden">(brand, SKU, size, weight…)</span>
          </summary>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label htmlFor="p-brand" className="label-text">Brand</label><input id="p-brand" className="field bg-white" value={v.brand} maxLength={80} onChange={(e) => set("brand", e.target.value)} placeholder="Wood & Wonders" /></div>
              <div><label htmlFor="p-sku" className="label-text">SKU / model number</label><input id="p-sku" className="field bg-white" value={v.sku} maxLength={60} onChange={(e) => set("sku", e.target.value)} /><F k="sku" /></div>
              <div><label htmlFor="p-w" className="label-text">Width (cm)</label><input id="p-w" inputMode="decimal" className="field bg-white" value={v.widthCm} onChange={(e) => set("widthCm", e.target.value.replace(/[^\d.]/g, ""))} /></div>
              <div><label htmlFor="p-d" className="label-text">Depth (cm)</label><input id="p-d" inputMode="decimal" className="field bg-white" value={v.depthCm} onChange={(e) => set("depthCm", e.target.value.replace(/[^\d.]/g, ""))} /></div>
              <div><label htmlFor="p-h" className="label-text">Height (cm)</label><input id="p-h" inputMode="decimal" className="field bg-white" value={v.heightCm} onChange={(e) => set("heightCm", e.target.value.replace(/[^\d.]/g, ""))} /></div>
              <div><label htmlFor="p-wt" className="label-text">Item weight (kg)</label><input id="p-wt" inputMode="decimal" className="field bg-white" value={v.weightKg} onChange={(e) => set("weightKg", e.target.value.replace(/[^\d.]/g, ""))} /></div>
              <div>
                <label htmlFor="p-assembly" className="label-text">Assembly</label>
                <select id="p-assembly" className="field bg-white" value={v.assembly} onChange={(e) => set("assembly", e.target.value)}>
                  <option value="">Not specified</option>
                  {ASSEMBLY_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div><label htmlFor="p-warranty" className="label-text">Warranty (months)</label><input id="p-warranty" inputMode="numeric" className="field bg-white" value={v.warrantyMonths} onChange={(e) => set("warrantyMonths", e.target.value.replace(/\D/g, ""))} /></div>
              <div><label htmlFor="p-origin" className="label-text">Country of origin</label><input id="p-origin" className="field bg-white" value={v.countryOfOrigin} maxLength={60} onChange={(e) => set("countryOfOrigin", e.target.value)} placeholder="India" /></div>
            </div>
            <div className="border-t border-line pt-4">
              <SpecsEditor categorySlug={categories.find((c) => c.id === v.categoryId)?.slug} value={v.specs} onChange={(specs) => set("specs", specs)} />
            </div>
          </div>
        </details>
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
