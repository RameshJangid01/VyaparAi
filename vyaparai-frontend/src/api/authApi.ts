import axiosInstance from './axiosInstance'
import type { ApiEnvelope, AuthResponse, LoginRequest, SignupRequest } from '../types/auth'

// Backend wraps every response in { success, message, data } (see ApiResponse<T> in
// VyaparAI.Api). We always unwrap `.data.data` here so the rest of the app can work
// with plain AuthResponse objects.
export const authApi = {
  signup: async (payload: SignupRequest): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<ApiEnvelope<AuthResponse>>('/auth/signup', payload)
    return data.data
  },
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<ApiEnvelope<AuthResponse>>('/auth/login', payload)
    return data.data
  },
}
