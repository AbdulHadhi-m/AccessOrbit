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