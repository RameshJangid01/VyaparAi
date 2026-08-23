import axiosInstance from './axiosInstance'
import type { ApiEnvelope } from '../types/auth'
import type {
    AdminDashboard,
    AdminBusiness,
    AdminUser,
    AdminProductsOverview,
    AdminSalesOverview,
    SystemSettings,
    FestivalEvent,
    FestivalFormValues,
} from '../types/admin'

export const adminApi = {
    getDashboard: async (): Promise<AdminDashboard> => {
        const { data } = await axiosInstance.get<ApiEnvelope<AdminDashboard>>(
            '/admin/dashboard',
        )
        return data.data
    },

    getBusinesses: async (): Promise<AdminBusiness[]> => {
        const { data } = await axiosInstance.get<ApiEnvelope<AdminBusiness[]>>(
            '/admin/businesses',
        )
        return data.data
    },

    toggleBusinessStatus: async (
        id: string,
        isActive: boolean,
    ): Promise<void> => {
        await axiosInstance.post(`/admin/businesses/${id}/status`, isActive)
    },

    getUsers: async (): Promise<AdminUser[]> => {
        const { data } =
            await axiosInstance.get<ApiEnvelope<AdminUser[]>>('/admin/users')
        return data.data
    },

    toggleUserStatus: async (id: string, isActive: boolean): Promise<void> => {
        await axiosInstance.post(`/admin/users/${id}/status`, isActive)
    },

    updateUserRole: async (id: string, role: string): Promise<void> => {
        await axiosInstance.post(`/admin/users/${id}/role`, { role })
    },

    getProductsOverview: async (): Promise<AdminProductsOverview> => {
        const { data } = await axiosInstance.get<
            ApiEnvelope<AdminProductsOverview>
        >('/admin/products')
        return data.data
    },

    getSalesOverview: async (): Promise<AdminSalesOverview> => {
        const { data } = await axiosInstance.get<ApiEnvelope<AdminSalesOverview>>(
            '/admin/sales',
        )
        return data.data
    },

    getFestivals: async (): Promise<FestivalEvent[]> => {
        const { data } = await axiosInstance.get<ApiEnvelope<FestivalEvent[]>>(
            '/admin/festivals',
        )
        return data.data
    },

    createFestival: async (
        payload: FestivalFormValues,
    ): Promise<FestivalEvent> => {
        const { data } = await axiosInstance.post<ApiEnvelope<FestivalEvent>>(
            '/admin/festivals',
            payload,
        )
        return data.data
    },

    updateFestival: async (
        id: string,
        payload: FestivalFormValues,
    ): Promise<FestivalEvent> => {
        const { data } = await axiosInstance.put<ApiEnvelope<FestivalEvent>>(
            `/admin/festivals/${id}`,
            payload,
        )
        return data.data
    },

    deleteFestival: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/admin/festivals/${id}`)
    },

    getSettings: async (): Promise<SystemSettings> => {
        const { data } =
            await axiosInstance.get<ApiEnvelope<SystemSettings>>('/admin/settings')
        return data.data
    },
}
