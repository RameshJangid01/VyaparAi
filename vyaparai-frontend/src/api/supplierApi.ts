import axiosInstance from './axiosInstance'
import type { ApiEnvelope } from '../types/auth'
import type { PagedResult } from '../types/common'
import type { Supplier, SupplierFormValues, SupplierQuery } from '../types/supplier'

export const supplierApi = {
  list: async (query: SupplierQuery): Promise<PagedResult<Supplier>> => {
    const { data } = await axiosInstance.get<ApiEnvelope<PagedResult<Supplier>>>('/suppliers', {
      params: query,
    })
    return data.data
  },
  getById: async (id: string): Promise<Supplier> => {
    const { data } = await axiosInstance.get<ApiEnvelope<Supplier>>(`/suppliers/${id}`)
    return data.data
  },
  create: async (payload: SupplierFormValues): Promise<Supplier> => {
    const { data } = await axiosInstance.post<ApiEnvelope<Supplier>>('/suppliers', payload)
    return data.data
  },
  update: async (id: string, payload: SupplierFormValues): Promise<Supplier> => {
    const { data } = await axiosInstance.put<ApiEnvelope<Supplier>>(`/suppliers/${id}`, payload)
    return data.data
  },
  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/suppliers/${id}`)
  },
}
