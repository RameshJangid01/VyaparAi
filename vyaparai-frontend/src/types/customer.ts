import type { PagedQuery } from './common'

export interface Customer {
  id: string
  name: string
  mobile: string
  email?: string | null
  address?: string | null
  totalPurchases: number
  totalPaid: number
  pendingAmount: number
  createdAt: string
  updatedAt: string
}

export interface CustomerFormValues {
  name: string
  mobile: string
  email?: string
  address?: string
}

export type CustomerQuery = PagedQuery
