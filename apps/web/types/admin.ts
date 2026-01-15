/**
 * Shared types for admin dashboard components
 */

export type Pagination = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type Admin = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  emailVerified: boolean;
  banned: boolean | null;
  createdAt: string | null;
};

export type Investor = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  emailVerified: boolean;
  banned: boolean | null;
  createdAt: string | null;
  kycStatus: string | null;
};

export type AdminsData = {
  admins: Admin[];
  pagination: Pagination;
};

export type InvestorsData = {
  investors: Investor[];
  pagination: Pagination;
};
