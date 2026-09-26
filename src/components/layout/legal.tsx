export function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="container-x max-w-3xl pt-10 lg:pt-14">
      <h1 className="text-[40px] leading-tight sm:text-[52px]">{title}</h1>
      <p className="mt-3 text-muted">Last updated {updated}</p>
      <div className="mt-10 space-y-4 text-[17px] leading-[1.75] text-ink/85 [&_h2]:mt-10 [&_h2]:font-sans [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1">
        {children}
      </div>
      <p className="mt-12 rounded-md bg-cane/40 p-4 text-sm text-ink/80">
        Template text for development. Have a lawyer review this before launch.
      </p>
    </article>
  );
}
