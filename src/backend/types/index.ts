// Backend-internal types that aren't shared with frontend

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface ServiceResult<T> {
  data: T;
  error?: string;
}
