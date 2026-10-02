import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-x flex min-h-[70vh] flex-col items-center justify-center gap-8 py-16">
      <Link href="/" aria-label="Wood & Wonders home">
        <Image src="/brand/logo.png" alt="Wood & Wonders" width={600} height={428} priority className="h-[72px] w-auto" />
      </Link>
      {children}
    </div>
  );
}
