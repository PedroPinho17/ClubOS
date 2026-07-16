import type { PaginatedResult } from "@clubos/shared";

export type { PaginatedResult };

export function parsePagination(
  query: { page?: string | number; limit?: string | number },
  defaults: { page?: number; limit?: number; maxLimit?: number } = {},
): { page: number; limit: number; skip: number } {
  const defaultPage = defaults.page ?? 1;
  const defaultLimit = defaults.limit ?? 25;
  const maxLimit = defaults.maxLimit ?? 100;

  const pageRaw =
    query.page === undefined || query.page === null || query.page === ""
      ? String(defaultPage)
      : String(query.page);
  const limitRaw =
    query.limit === undefined || query.limit === null || query.limit === ""
      ? String(defaultLimit)
      : String(query.limit);

  const page = Math.max(1, Number.parseInt(pageRaw, 10) || defaultPage);
  let limit = Number.parseInt(limitRaw, 10) || defaultLimit;
  limit = Math.min(Math.max(1, limit), maxLimit);

  return { page, limit, skip: (page - 1) * limit };
}

export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
