export function parsePagination(query: any) {
  const limit = Math.min(Math.max(parseInt(query.limit as string) || 20, 1), 100);
  const cursor = (query.cursor as string) || null;
  return { limit, cursor };
}
