export function PageHeading({ children }: { children: string }) {
  return (
    <>
      <title>{`${children} · Notes`}</title>
      <h1 tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none sm:text-3xl">
        {children}
      </h1>
    </>
  );
}
