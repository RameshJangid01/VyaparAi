// Mirrors VyaparAI.Api/DTOs/Admin/AdminDtos.cs and DTOs/Festivals/FestivalDtos.cs
// Keep these in sync if the backend DTOs change shape.

export interface AdminBusinessGrowth {
    month: string
    newBusinesses: number
}

export interface AdminSalesActivity {
    date: string
    revenue: number
    orders: number
}

export interface AdminDashboard {
    totalBusinesses: number
    activeBusinesses: number
    totalUsers: number
    totalProducts: number
    totalSalesCount: number
    totalPurchasesCount: number
    totalPlatformRevenue: number
    activeUsersToday: number
    businessGrowth: AdminBusinessGrowth[]
    salesActivity: AdminSalesActivity[]
}

export interface AdminBusiness {
    id: string
    businessName: string
    ownerName: string
    email: string
    mobileNumber: string
    gstNumber?: string | null
    createdAt: string
    totalProducts: number
    totalSales: number
    totalRevenue: number
    isActive: boolean
}

export interface AdminUser {
    id: string
    ownerName: string
    email: string
    mobileNumber: string
    businessId: string
    businessName: string
    role: string
    createdAt: string
    isActive: boolean
}

export interface CategoryDistribution {
    category: string
    productCount: number
}

export interface AdminProductsOverview {
    totalProducts: number
    activeCategoriesCount: number
    totalPlatformInventoryValue: number
    categoryDistribution: CategoryDistribution[]
}

export interface AdminSalesOverview {
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    totalTaxCollected: number
}

export interface SystemSettings {
    environment: string
    databaseName: string
    databaseConnected: boolean
    aiModelConfigured: string
    aiConfigured: boolean
    serverTimeUtc: string
    apiVersion: string
}

// Festivals (used by the Admin > Festivals tab)

export interface FestivalEvent {
    id: string
    name: string
    startDate: string
    endDate: string
    region: string
    relevantCategories: string[]
    demandMultiplier: number
    description?: string | null
    daysRemaining: number
    isActive: boolean
}

export interface FestivalFormValues {
    name: string
    startDate: string
    endDate: string
    region: string
    relevantCategories: string[]
    demandMultiplier: number
    description?: string | null
}
