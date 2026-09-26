"use client";
import { signOut } from "@/lib/auth-client";

export function SignOutButton({ className = "btn-outline" }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={async () => { await signOut(); window.location.assign("/"); }}>
      Sign out
    </button>
  );
}
