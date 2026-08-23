export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PagedQuery {
  search?: string
  page?: number
  pageSize?: number
}
