import type { PagedQuery } from './common'
import type { StockStatus } from './product'

export interface InventoryItem {
  productId: string
  productName: string
  sku: string
  category: string
  unit: string
  currentQuantity: number
  minimumStockLevel: number
  purchasePrice: number
  sellingPrice: number
  stockValue: number
  stockStatus: StockStatus
}

export interface InventorySummary {
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalStockValue: number
}

export interface InventoryTransaction {
  id: string
  productId: string
  productName: string
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN'
  quantity: number
  previousQuantity: number
  newQuantity: number
  referenceType: string
  referenceId?: string | null
  date: string
}

export interface InventoryQuery extends PagedQuery {
  category?: string
}

export interface TransactionQuery extends PagedQuery {
  productId?: string
}

export interface AdjustStockPayload {
  productId: string
  quantityChange: number
  reason: string
}
