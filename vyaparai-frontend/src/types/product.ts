import type { PagedQuery } from './common'

export type StockStatus = 'OK' | 'LOW' | 'OUT'

export interface Product {
  id: string
  name: string
  sku: string
  barcode?: string | null
  category: string
  brand?: string | null
  purchasePrice: number
  sellingPrice: number
  gstPercentage: number
  currentQuantity: number
  minimumStockLevel: number
  supplierId?: string | null
  supplierName?: string | null
  expiryDate?: string | null
  unit: string
  isActive: boolean
  stockStatus: StockStatus
  createdAt: string
  updatedAt: string
}

export interface ProductFormValues {
  name: string
  sku: string
  barcode?: string
  category: string
  brand?: string
  purchasePrice: number
  sellingPrice: number
  gstPercentage: number
  currentQuantity?: number // only sent on create
  minimumStockLevel: number
  supplierId?: string
  expiryDate?: string
  unit: string
  isActive?: boolean
}

export interface ProductQuery extends PagedQuery {
  category?: string
  lowStockOnly?: boolean
  includeInactive?: boolean
}
