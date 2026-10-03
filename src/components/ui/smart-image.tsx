"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

// Cloudinary URLs we build already carry a transformation (f_auto,q_auto,c_.../w_<n>)
// sized for one specific usage. When next/image asks for a different width per
// device-pixel-ratio bucket, re-target that same transformation at the new width
// instead of also routing the image through Vercel's optimizer (double processing).
function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const m = src.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)([^/]+)(\/.+)$/);
  if (!m) return src;
  const kept = m[2].split(",").filter((p) => !/^w_\d+$/.test(p) && !/^q_/.test(p) && !/^f_/.test(p));
  const params = ["f_auto", `q_${quality ?? "auto"}`, ...kept, `w_${width}`].join(",");
  return `${m[1]}${params}${m[3]}`;
}

/** next/image with a graceful fallback if a remote image is missing, and a Cloudinary-aware loader. */
export function SmartImage(props: ImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        role="img"
        aria-label={typeof props.alt === "string" ? props.alt : ""}
        className={`${props.className ?? ""} flex items-center justify-center bg-plaster text-muted/40`}
        style={props.fill ? { position: "absolute", inset: 0 } : { width: props.width, height: props.height }}
      >
        <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="7" y="9" width="34" height="30" rx="2" />
          <circle cx="17" cy="19" r="3" />
          <path d="M41 30l-10-9-9 8-5-4-10 8" />
        </svg>
      </div>
    );
  }
  const isCloudinary = typeof props.src === "string" && props.src.includes("res.cloudinary.com/");
  // eslint-disable-next-line jsx-a11y/alt-text
  return (
    <Image
      {...props}
      loader={isCloudinary ? cloudinaryLoader : props.loader}
      onError={(e) => {
        props.onError?.(e);
        setFailed(true);
      }}
    />
  );
}
