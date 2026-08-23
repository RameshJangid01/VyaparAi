import type { PagedQuery } from './common'

export interface Supplier {
  id: string
  supplierName: string
  contactPerson?: string | null
  mobile: string
  email?: string | null
  address?: string | null
  gstNumber?: string | null
  totalPurchases: number
  paid: number
  pending: number
  createdAt: string
  updatedAt: string
}

export interface SupplierFormValues {
  supplierName: string
  contactPerson?: string
  mobile: string
  email?: string
  address?: string
  gstNumber?: string
}

export type SupplierQuery = PagedQuery
