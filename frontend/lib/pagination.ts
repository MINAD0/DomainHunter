export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * safePageSize;
  const pageItems = items.slice(start, start + safePageSize);

  return {
    currentPage,
    pageItems,
    totalPages
  };
}
