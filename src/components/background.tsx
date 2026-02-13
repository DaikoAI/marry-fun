export function Background() {
  return (
    <>
      <div className="absolute inset-0 bg-[url('/bg.png')] bg-cover bg-center" />
      <div className="marry-sparkles pointer-events-none absolute inset-0 opacity-70 motion-reduce:hidden" />
    </>
  );
}
