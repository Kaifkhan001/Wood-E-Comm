export default function Loading() {
  return (
    <div aria-busy="true">
      <div className="skeleton h-10 w-56" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28" />)}</div>
      <div className="skeleton mt-8 h-72" />
    </div>
  );
}
