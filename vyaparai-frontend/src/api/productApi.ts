import axiosInstance from './axiosInstance'
import type { ApiEnvelope } from '../types/auth'
import type { PagedResult } from '../types/common'
import type { Product, ProductFormValues, ProductQuery } from '../types/product'

export const productApi = {
  list: async (query: ProductQuery): Promise<PagedResult<Product>> => {
    const { data } = await axiosInstance.get<ApiEnvelope<PagedResult<Product>>>('/products', {
      params: query,
    })
    return data.data
  },
  getCategories: async (): Promise<string[]> => {
    const { data } = await axiosInstance.get<ApiEnvelope<string[]>>('/products/categories')
    return data.data
  },
  getById: async (id: string): Promise<Product> => {
    const { data } = await axiosInstance.get<ApiEnvelope<Product>>(`/products/${id}`)
    return data.data
  },
  create: async (payload: ProductFormValues): Promise<Product> => {
    const { data } = await axiosInstance.post<ApiEnvelope<Product>>('/products', payload)
    return data.data
  },
  update: async (id: string, payload: ProductFormValues): Promise<Product> => {
    const { data } = await axiosInstance.put<ApiEnvelope<Product>>(`/products/${id}`, payload)
    return data.data
  },
  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/products/${id}`)
  },
}
