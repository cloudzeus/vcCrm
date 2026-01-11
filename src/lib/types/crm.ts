import { CrmStatus } from "@prisma/client";

export type CrmStatusType = CrmStatus;

export interface Lead {
  id: string;
  title: string;
  description?: string;
  status: CrmStatusType;
  companyId: string;
  companyName: string;
  valueEstimate?: number;
  expectedClose?: Date | string;
  outcome?: string;
  closedAt?: Date | string;
  contactCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Proposal {
  id: string;
  title: string | null;
  totalAmount: number;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LeadDetail extends Lead {
  companyLogoUrl?: string;
  contacts: Contact[];
  proposals: Proposal[];
}

export interface Contact {
  id: string;
  name: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobPosition?: string;
  role?: string;
}

export interface LeadFormData {
  title: string;
  description?: string;
  status: CrmStatusType;
  companyId: string;
  valueEstimate?: number;
  expectedClose?: string;
  outcome?: string;
}

export interface CompanyListItem {
  id: string;
  name: string;
}

