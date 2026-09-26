"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/** next/image with a graceful fallback if a remote image is missing. */
export function SmartImage(props: ImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        role="img"
        aria-label={typeof props.alt === "string" ? props.alt : ""}
        className={`${props.className ?? ""} flex items-center justify-center bg-cane/40 text-sheesham/40`}
        style={props.fill ? { position: "absolute", inset: 0 } : { width: props.width, height: props.height }}
      >
        <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 30h32M12 30V20h24v10M14 30v8M34 30v8M12 20c0-4 3-7 7-7h10c4 0 7 3 7 7" />
        </svg>
      </div>
    );
  }
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image {...props} onError={() => setFailed(true)} />;
}
