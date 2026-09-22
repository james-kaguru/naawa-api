import type { Request, Response } from 'express';

export type Req = Request
export type Res = Response

interface PaginationMeta {
  page: number,
  perPage: number,
  totalPages: number,
  totalCount: number
}

type PaginationLinks = {
  self: string;
  first: string;
  prev: string | null;
  next: string | null;
  last: string;
};

export interface PaginationServiceResponse<TData> {
  data: TData[],
  meta: PaginationMeta
}

export type PaginationControllerResponse<TData> = PaginationServiceResponse<TData> & {
  links: PaginationLinks
}
