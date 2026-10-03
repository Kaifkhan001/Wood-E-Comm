"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, ImagePlus, RotateCcw, Star, Trash2, X } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { imageSrc } from "@/lib/images";
import { CropDialog } from "./crop-dialog";

export type UploaderImg = { publicId?: string | null; url?: string | null; alt: string };

const MAX_BYTES = 15 * 1024 * 1024;
const ACCEPT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"];
const ACCEPT_EXT = /\.(jpe?g|png|webp|avif|heic|heif)$/i;
const CONCURRENCY = 3;
const LOW_RES_EDGE = 1200;

type PendingStatus = "queued" | "uploading" | "error";
type Pending = {
  id: string;
  file: File;
  previewUrl: string;
  status: PendingStatus;
  progress: number;
  error?: string;
  lowRes?: boolean;
};
type CropTask = { id: string; file: File; previewUrl: string };

function isHeic(file: File) {
  return /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

function uploadFile(
  file: File | Blob,
  fileName: string,
  folder: string,
  onProgress: (pct: number) => void,
  xhrHolder: { xhr: XMLHttpRequest | null },
): Promise<{ public_id: string; secure_url: string }> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const sigRes = await fetch("/api/admin/upload-signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder }),
        });
        const sig = await sigRes.json();
        if (!sigRes.ok) return reject(new Error(sig.error || "Upload not allowed"));
        const form = new FormData();
        form.append("file", file, fileName);
        for (const k of ["api_key", "timestamp", "signature", "folder", "allowed_formats", "transformation"]) form.append(k, String(sig[k]));
        const xhr = new XMLHttpRequest();
        xhrHolder.xhr = xhr;
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error("Unexpected response, retry"));
            }
          } else {
            let msg = "Upload failed";
            try {
              msg = JSON.parse(xhr.responseText)?.error?.message || msg;
            } catch {
              /* ignore */
            }
            reject(new Error(msg));
          }
        };
        xhr.onerror = () => reject(new Error("Network error, retry"));
        xhr.onabort = () => reject(new Error("__ABORTED__"));
        xhr.send(form);
      } catch (e) {
        reject(e instanceof Error ? e : new Error("Upload failed"));
      }
    })();
  });
}

function SortableThumb({
  img,
  index,
  isCover,
  onAltChange,
  onRemove,
  onSetCover,
  onMove,
  showAlt,
  canMoveUp,
  canMoveDown,
}: {
  img: UploaderImg;
  index: number;
  isCover: boolean;
  onAltChange?: (alt: string) => void;
  onRemove: () => void;
  onSetCover: () => void;
  onMove: (dir: -1 | 1) => void;
  showAlt: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const id = `img-${index}`;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [failed, setFailed] = useState(false);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="rounded-md border border-line bg-white p-2"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-cane/30">
        <SmartImage src={imageSrc(img, 300, { fit: "cover", ar: "4:5" })} alt="" fill sizes="150px" className="object-cover" onError={() => setFailed(true)} />
        {failed && <span className="absolute left-1 top-1 rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-medium text-white">Image failed to load</span>}
        {isCover && <span className="absolute left-1 top-1 rounded-full bg-paper px-1.5 py-0.5 text-[10px] font-medium">Cover</span>}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder image ${index + 1}`}
          className="absolute right-1 top-1 flex h-7 w-7 cursor-grab touch-none items-center justify-center rounded-full bg-paper/90 text-ink active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
      {showAlt && (
        <input
          aria-label={`Alt text for image ${index + 1}`}
          className="mt-2 w-full rounded border border-line px-2 py-1 text-xs"
          placeholder="Describe the image"
          value={img.alt}
          maxLength={160}
          onChange={(e) => onAltChange?.(e.target.value)}
        />
      )}
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1">
        <div className="flex">
          <button type="button" onClick={() => onMove(-1)} disabled={!canMoveUp} className="p-1.5 disabled:opacity-30" aria-label="Move earlier"><ArrowUp className="h-4 w-4" /></button>
          <button type="button" onClick={() => onMove(1)} disabled={!canMoveDown} className="p-1.5 disabled:opacity-30" aria-label="Move later"><ArrowDown className="h-4 w-4" /></button>
          {!isCover && (
            <button type="button" onClick={onSetCover} className="p-1.5" aria-label="Set as cover"><Star className="h-4 w-4" /></button>
          )}
        </div>
        <button type="button" onClick={onRemove} className="p-1.5 text-danger" aria-label="Remove image"><Trash2 className="h-4 w-4" /></button>
      </div>
    </li>
  );
}

export function StockUrlField({ onAdd }: { onAdd: (url: string) => void }) {
  const [urlInput, setUrlInput] = useState("");
  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer text-muted">Add a stock image by URL (Unsplash or Cloudinary)</summary>
      <div className="mt-2 flex gap-2">
        <input className="field bg-white" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://images.unsplash.com/…" />
        <button
          type="button"
          className="btn-outline"
          onClick={() => {
            if (!/^https:\/\/(images\.unsplash\.com|res\.cloudinary\.com)\//.test(urlInput)) return toast.error("Only Unsplash or Cloudinary URLs are allowed.");
            onAdd(urlInput);
            setUrlInput("");
          }}
        >
          Add
        </button>
      </div>
    </details>
  );
}

export function ImageUploader({
  value,
  onChange,
  folder,
  max,
  altDefault,
  showAlt = true,
  onUploadingChange,
}: {
  value: UploaderImg[];
  onChange: (next: UploaderImg[]) => void;
  folder: string;
  max: number;
  altDefault: string;
  showAlt?: boolean;
  onUploadingChange?: (n: number) => void;
}) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [cropQueue, setCropQueue] = useState<CropTask[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const xhrRefs = useRef<Map<string, { xhr: XMLHttpRequest | null }>>(new Map());
  const fileRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const active = pending.filter((p) => p.status !== "error").length;
    onUploadingChange?.(active);
  }, [pending, onUploadingChange]);

  const remaining = max - value.length - pending.length;

  function addFiles(files: FileList | File[] | null) {
    if (!files) return;
    const list = Array.from(files).slice(0, Math.max(0, remaining));
    if (Array.from(files).length > list.length) toast.error(`Only ${max} images allowed; some files were skipped.`);
    for (const file of list) {
      const extOk = ACCEPT_TYPES.includes(file.type) || ACCEPT_EXT.test(file.name);
      if (!extOk) {
        toast.error(`${file.name}: use JPG, PNG, WebP, AVIF or HEIC.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 15 MB.`);
        continue;
      }
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      // Most browsers besides Safari can't decode HEIC/HEIF for preview or canvas cropping,
      // so those go straight to upload -- Cloudinary converts the format on its side.
      if (isHeic(file)) queueUpload(id, file, previewUrl);
      else setCropQueue((q) => [...q, { id, file, previewUrl }]);
    }
  }

  function queueUpload(id: string, file: File, previewUrl: string) {
    setPending((p) => [...p, { id, file, previewUrl, status: "queued", progress: 0 }]);
    const img = new window.Image();
    img.onload = () => {
      if (Math.min(img.naturalWidth, img.naturalHeight) < LOW_RES_EDGE) {
        setPending((p) => p.map((x) => (x.id === id ? { ...x, lowRes: true } : x)));
      }
    };
    img.src = previewUrl;
  }

  // Reads the head of cropQueue and removes it via a pure updater, then performs the
  // (necessarily impure) upload side effect separately -- React 19 Strict Mode
  // double-invokes state updater functions to catch exactly this kind of mistake,
  // which previously caused each "Use as is"/crop click to queue two uploads.
  function resolveCropTask(useAsIs: boolean, blob?: Blob) {
    const task = cropQueue[0];
    if (!task) return;
    setCropQueue((q) => q.slice(1));
    if (useAsIs) {
      queueUpload(task.id, task.file, task.previewUrl);
    } else if (blob) {
      const croppedFile = new File([blob], task.file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
      const croppedPreview = URL.createObjectURL(blob);
      URL.revokeObjectURL(task.previewUrl);
      queueUpload(task.id, croppedFile, croppedPreview);
    }
  }

  // Upload queue: start queued items while under the concurrency cap. startedRef
  // guards against Strict Mode's double-invocation of this effect in dev, which
  // would otherwise start the same upload twice before the first status update commits.
  const startedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const uploading = pending.filter((p) => p.status === "uploading").length;
    const next = pending.find((p) => p.status === "queued" && !startedRef.current.has(p.id));
    if (!next || uploading >= CONCURRENCY) return;
    startedRef.current.add(next.id);

    setPending((p) => p.map((x) => (x.id === next.id ? { ...x, status: "uploading" } : x)));
    const holder: { xhr: XMLHttpRequest | null } = { xhr: null };
    xhrRefs.current.set(next.id, holder);

    uploadFile(next.file, next.file.name, folder, (pct) => {
      setPending((p) => p.map((x) => (x.id === next.id ? { ...x, progress: pct } : x)));
    }, holder)
      .then((data) => {
        onChange([...valueRef.current, { publicId: data.public_id, url: data.secure_url, alt: altDefault }]);
        setPending((p) => p.filter((x) => x.id !== next.id));
        URL.revokeObjectURL(next.previewUrl);
        xhrRefs.current.delete(next.id);
        startedRef.current.delete(next.id);
      })
      .catch((e: Error) => {
        xhrRefs.current.delete(next.id);
        if (e.message === "__ABORTED__") {
          setPending((p) => p.filter((x) => x.id !== next.id));
          URL.revokeObjectURL(next.previewUrl);
          startedRef.current.delete(next.id);
          return;
        }
        setPending((p) => p.map((x) => (x.id === next.id ? { ...x, status: "error", error: e.message } : x)));
        startedRef.current.delete(next.id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, folder, altDefault]);

  function cancelPending(id: string) {
    const holder = xhrRefs.current.get(id);
    if (holder?.xhr) holder.xhr.abort();
    else setPending((p) => p.filter((x) => x.id !== id));
  }

  function retryPending(id: string) {
    setPending((p) => p.map((x) => (x.id === id ? { ...x, status: "queued", progress: 0, error: undefined } : x)));
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files = e.clipboardData?.files;
      if (files && files.length > 0) addFiles(files);
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  useEffect(
    () => () => {
      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = Number(String(active.id).replace("img-", ""));
    const to = Number(String(over.id).replace("img-", ""));
    onChange(arrayMove(value, from, to));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  const currentCrop = cropQueue[0];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-base font-semibold">Images</h2>
        <span className="text-sm text-muted">{value.length + pending.length}/{max}, first image is the cover</span>
      </div>
      <p className="mt-1 text-xs text-muted">Images are attached when you save.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        className={`mt-3 rounded-md border-2 border-dashed p-4 text-center text-sm transition-colors ${dragOver ? "border-bottle bg-bottle/5" : "border-line"}`}
      >
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={remaining <= 0}
          className="flex w-full flex-col items-center gap-1.5 text-muted hover:text-bottle disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ImagePlus className="h-6 w-6" />
          <span className="font-medium text-ink">Drag photos here, or tap to choose</span>
          <span className="text-xs">JPG, PNG, WebP, AVIF or HEIC, up to 15 MB. You can also paste an image.</span>
        </button>
        <input ref={fileRef} type="file" accept={ACCEPT_TYPES.join(",")} multiple hidden onChange={(e) => { addFiles(e.target.files); if (fileRef.current) fileRef.current.value = ""; }} />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={value.map((_, i) => `img-${i}`)} strategy={rectSortingStrategy}>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {value.map((img, i) => (
              <SortableThumb
                key={(img.publicId ?? img.url ?? "") + i}
                img={img}
                index={i}
                isCover={i === 0}
                showAlt={showAlt}
                onAltChange={(alt) => onChange(value.map((x, j) => (j === i ? { ...x, alt } : x)))}
                onRemove={() => onChange(value.filter((_, j) => j !== i))}
                onSetCover={() => onChange([img, ...value.filter((_, j) => j !== i)])}
                onMove={(dir) => move(i, dir)}
                canMoveUp={i > 0}
                canMoveDown={i < value.length - 1}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {pending.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {pending.map((p) => (
            // eslint-disable-next-line react/jsx-key
            <li key={p.id} className="rounded-md border border-line p-2">
              <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-cane/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                {p.status === "uploading" && (
                  <div className="absolute inset-x-0 bottom-0 bg-ink/60 px-2 py-1.5">
                    <div className="h-1.5 overflow-hidden rounded-full bg-paper/30">
                      <div className="h-full bg-paper transition-all" style={{ width: `${p.progress}%` }} />
                    </div>
                    <p className="mt-1 text-center text-[10px] text-paper">{p.progress}%</p>
                  </div>
                )}
                {p.status === "queued" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/40 text-xs font-medium text-paper">Waiting…</div>
                )}
                {p.status === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-danger/90 p-2 text-center text-xs text-white">
                    <span>{p.error || "Upload failed"}</span>
                  </div>
                )}
                {p.lowRes && p.status !== "error" && (
                  <span className="absolute left-1 top-1 rounded-full bg-brass px-1.5 py-0.5 text-[9px] font-medium text-white">Low resolution</span>
                )}
                <button
                  type="button"
                  onClick={() => cancelPending(p.id)}
                  aria-label="Cancel upload"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-paper/90 text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {p.status === "error" && (
                <button type="button" onClick={() => retryPending(p.id)} className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-md border border-line py-1 text-xs hover:border-bottle">
                  <RotateCcw className="h-3.5 w-3.5" /> Retry
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {currentCrop && (
        <CropDialog
          fileName={currentCrop.file.name}
          imageSrc={currentCrop.previewUrl}
          onUseAsIs={() => resolveCropTask(true)}
          onCropped={(blob) => resolveCropTask(false, blob)}
          onCancelAll={() => {
            cropQueue.forEach((t) => URL.revokeObjectURL(t.previewUrl));
            setCropQueue([]);
          }}
        />
      )}
    </div>
  );
}
