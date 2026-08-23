import axiosInstance from './axiosInstance'
import type { ApiEnvelope } from '../types/auth'
import type { PagedResult } from '../types/common'
import type { Customer, CustomerFormValues, CustomerQuery } from '../types/customer'

export const customerApi = {
  list: async (query: CustomerQuery): Promise<PagedResult<Customer>> => {
    const { data } = await axiosInstance.get<ApiEnvelope<PagedResult<Customer>>>('/customers', {
      params: query,
    })
    return data.data
  },
  getById: async (id: string): Promise<Customer> => {
    const { data } = await axiosInstance.get<ApiEnvelope<Customer>>(`/customers/${id}`)
    return data.data
  },
  create: async (payload: CustomerFormValues): Promise<Customer> => {
    const { data } = await axiosInstance.post<ApiEnvelope<Customer>>('/customers', payload)
    return data.data
  },
  update: async (id: string, payload: CustomerFormValues): Promise<Customer> => {
    const { data } = await axiosInstance.put<ApiEnvelope<Customer>>(`/customers/${id}`, payload)
    return data.data
  },
  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/customers/${id}`)
  },
}
