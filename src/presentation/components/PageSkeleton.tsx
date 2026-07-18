const PageSkeleton = () => (
  <div className="mx-auto w-full max-w-[100rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10" role="status">
    <span className="sr-only">Cargando contenido...</span>
    <div className="skeleton h-4 w-24" />
    <div className="skeleton mt-3 h-9 w-full max-w-sm" />
    <div className="skeleton mt-3 h-4 w-full max-w-2xl" />
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div className="skeleton h-40 w-full" />
      <div className="skeleton h-40 w-full" />
      <div className="skeleton h-40 w-full sm:col-span-2 xl:col-span-1" />
    </div>
  </div>
);

export default PageSkeleton;
