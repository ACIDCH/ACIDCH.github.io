export const NOTES_PAGE_SIZE = 12;

export interface PaginationSlice<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

export function getTotalPages(totalItems: number, pageSize: number): number {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError("Page size must be a positive integer.");
  }

  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function paginate<T>(
  items: readonly T[],
  currentPage: number,
  pageSize: number,
): PaginationSlice<T> {
  const totalPages = getTotalPages(items.length, pageSize);
  if (!Number.isInteger(currentPage) || currentPage < 1 || currentPage > totalPages) {
    throw new RangeError(`Page ${currentPage} is outside 1-${totalPages}.`);
  }

  const start = (currentPage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    currentPage,
    totalPages,
    pageSize,
    totalItems: items.length,
  };
}

export function getGeneratedPageNumbers(
  totalItems: number,
  pageSize: number,
): number[] {
  return Array.from(
    { length: Math.max(0, getTotalPages(totalItems, pageSize) - 1) },
    (_, index) => index + 2,
  );
}

export function getPaginationPath(basePath: string, page: number): string {
  const base = `/${basePath.replace(/^\/+|\/+$/g, "")}/`;
  return page === 1 ? base : `${base}page/${page}/`;
}

export function withQuery(
  path: string,
  query: Record<string, string | undefined> = {},
): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.size ? `${path}?${params.toString()}` : path;
}
