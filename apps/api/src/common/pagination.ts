export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function parsePagination(
  query: { page?: string; limit?: string },
  defaults: { page?: number; limit?: number; maxLimit?: number } = {},
): { page: number; limit: number; skip: number } {
  const defaultPage = defaults.page ?? 1;
  const defaultLimit = defaults.limit ?? 25;
  const maxLimit = defaults.maxLimit ?? 100;

  const page = Math.max(1, Number.parseInt(query.page ?? String(defaultPage), 10) || defaultPage);
  let limit = Number.parseInt(query.limit ?? String(defaultLimit), 10) || defaultLimit;
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
