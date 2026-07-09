import { describe, expect, it } from 'vitest';
import { paginated, parsePagination } from './pagination';

describe('parsePagination', () => {
  it('usa defaults e limita o maximo', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 25, skip: 0 });
    expect(parsePagination({ limit: '999' }, { maxLimit: 100 }).limit).toBe(100);
  });

  it('calcula skip por pagina', () => {
    expect(parsePagination({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10, skip: 20 });
  });
});

describe('paginated', () => {
  it('devolve metadados de pagina', () => {
    expect(paginated([1, 2], 50, 2, 25)).toEqual({
      items: [1, 2],
      total: 50,
      page: 2,
      limit: 25,
      totalPages: 2,
    });
  });
});
