namespace VyaparAI.Api.DTOs.Admin;

public class AdminDashboardDto
{
    public int TotalBusinesses { get; set; }
    public int ActiveBusinesses { get; set; }
    public int TotalUsers { get; set; }
    public int TotalProducts { get; set; }
    public int TotalSalesCount { get; set; }
    public int TotalPurchasesCount { get; set; }
    public decimal TotalPlatformRevenue { get; set; }
    public int ActiveUsersToday { get; set; }
    public List<AdminBusinessGrowthDto> BusinessGrowth { get; set; } = new();
    public List<AdminSalesActivityDto> SalesActivity { get; set; } = new();
}

public class AdminBusinessGrowthDto
{
    public string Month { get; set; } = string.Empty;
    public int NewBusinesses { get; set; }
}

public class AdminSalesActivityDto
{
    public string Date { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
}

public class AdminBusinessDto
{
    public string Id { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? GstNumber { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TotalProducts { get; set; }
    public int TotalSales { get; set; }
    public decimal TotalRevenue { get; set; }
    public bool IsActive { get; set; } = true;
}

public class AdminUserDto
{
    public string Id { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string BusinessId { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public string Role { get; set; } = "Owner";
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; } = true;
}

public class AdminProductsOverviewDto
{
    public int TotalProducts { get; set; }
    public int ActiveCategoriesCount { get; set; }
    public decimal TotalPlatformInventoryValue { get; set; }
    public List<CategoryDistributionDto> CategoryDistribution { get; set; } = new();
}

public class CategoryDistributionDto
{
    public string Category { get; set; } = string.Empty;
    public int ProductCount { get; set; }
}

public class AdminSalesOverviewDto
{
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageOrderValue { get; set; }
    public decimal TotalTaxCollected { get; set; }
}

public class SystemSettingsDto
{
    public string Environment { get; set; } = "Production";
    public string DatabaseName { get; set; } = "VyaparAI";
    public bool DatabaseConnected { get; set; } = true;
    public string AiModelConfigured { get; set; } = "gemini-2.0-flash";
    public bool AiConfigured { get; set; } = true;
    public string ServerTimeUtc { get; set; } = string.Empty;
    public string ApiVersion { get; set; } = "v1.0";
}
