import axiosInstance from './axiosInstance'
import type { ApiEnvelope } from '../types/auth'
import type { PagedResult } from '../types/common'
import type {
  AdjustStockPayload,
  InventoryItem,
  InventoryQuery,
  InventorySummary,
  InventoryTransaction,
  TransactionQuery,
} from '../types/inventory'

export const inventoryApi = {
  overview: async (query: InventoryQuery): Promise<PagedResult<InventoryItem>> => {
    const { data } = await axiosInstance.get<ApiEnvelope<PagedResult<InventoryItem>>>('/inventory', {
      params: query,
    })
    return data.data
  },
  summary: async (): Promise<InventorySummary> => {
    const { data } = await axiosInstance.get<ApiEnvelope<InventorySummary>>('/inventory/summary')
    return data.data
  },
  lowStock: async (): Promise<InventoryItem[]> => {
    const { data } = await axiosInstance.get<ApiEnvelope<InventoryItem[]>>('/inventory/low-stock')
    return data.data
  },
  transactions: async (query: TransactionQuery): Promise<PagedResult<InventoryTransaction>> => {
    const { data } = await axiosInstance.get<ApiEnvelope<PagedResult<InventoryTransaction>>>(
      '/inventory/transactions',
      { params: query },
    )
    return data.data
  },
  adjustStock: async (payload: AdjustStockPayload): Promise<InventoryItem> => {
    const { data } = await axiosInstance.post<ApiEnvelope<InventoryItem>>('/inventory/adjust', payload)
    return data.data
  },
}
