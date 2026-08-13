export interface ApiErrorField {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: ApiErrorField[];
}

export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
  requestId: string;
}

export interface ApiFailure {
  success: false;
  message: string;
  error: ApiErrorBody;
  requestId: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
  order?: "asc" | "desc";
  moduleId?: string;
  subModuleId?: string;
  roleId?: string;
}