import type { OrgPermissions, Role } from "@/auth";
import type { Request, Response } from "express";
export * from "./service";

type ReqShape = {
  params?: unknown;
  body?: unknown;
  query?: unknown;
};

type Field<T, K extends keyof ReqShape, Default> =
  T extends Record<K, infer V> ? V : Default;

/**
 * Express Request typed by name instead of position, mirroring `validate({ params, body, query })`.
 * @example Req<{ query: FindParentsSchema }>
 */
export type Req<T extends ReqShape = {}> = Request<
  Field<T, "params", Request["params"]>,
  unknown,
  Field<T, "body", unknown>,
  Field<T, "query", Request["query"]>
>;

export type Res<ResBody = unknown> = Response<ResBody>;

interface PaginationMeta {
  page: number;
  perPage: number;
  totalPages: number;
  totalCount: number;
}

type PaginationLinks = {
  self: string;
  first: string;
  prev: string | null;
  next: string | null;
  last: string;
};

export interface PaginationServiceResponse<TData> {
  data: TData[];
  meta: PaginationMeta;
}

export type PaginationControllerResponse<TData> =
  PaginationServiceResponse<TData> & {
    links: PaginationLinks;
  };

export interface UserAuthInfo {
  role: Role;
  staffId: string | null;
  parentId: string | null;
  permissions: OrgPermissions;
}
