"use client";
import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImageBlob } from "@/lib/crop-image";

export function CropDialog({
  fileName,
  imageSrc,
  onUseAsIs,
  onCropped,
  onCancelAll,
}: {
  fileName: string;
  imageSrc: string;
  onUseAsIs: () => void;
  onCropped: (blob: Blob) => void;
  onCancelAll: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  async function confirmCrop() {
    if (!area) return;
    setWorking(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, area);
      onCropped(blob);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={`Crop ${fileName}`} className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/70 p-4">
      <div className="flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-paper">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="truncate text-base font-semibold">{fileName}</h2>
          <button type="button" onClick={onCancelAll} className="shrink-0 text-sm text-muted hover:text-ink">Cancel all</button>
        </div>
        <div className="relative h-[55vh] min-h-[280px] bg-ink/90">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={4 / 5}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label htmlFor="crop-zoom" className="label-text">Zoom</label>
            <input id="crop-zoom" type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-bottle" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={onUseAsIs} disabled={working} className="btn-outline flex-1">Use as is</button>
            <button type="button" onClick={confirmCrop} disabled={working || !area} className="btn-primary flex-1">{working ? "Cropping…" : "Crop to 4:5"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
