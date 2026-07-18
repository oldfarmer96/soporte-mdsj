const CatalogListSkeleton = () => (
  <div className="grid gap-3" role="status">
    <span className="sr-only">Cargando catálogo...</span>
    {[0, 1, 2].map((item) => (
      <div
        key={item}
        className="rounded-box border border-base-300 bg-base-100 p-5"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="skeleton h-5 w-48 max-w-2/3" />
          <div className="skeleton h-5 w-16" />
        </div>
        <div className="skeleton mt-4 h-4 w-full max-w-xl" />
        <div className="skeleton mt-2 h-4 w-40" />
      </div>
    ))}
  </div>
);

export default CatalogListSkeleton;
