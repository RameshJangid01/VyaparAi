namespace VyaparAI.Api.DTOs.Dashboard;

public class KpiSummaryDto
{
    public decimal TodaySales { get; set; }
    public decimal TodayProfit { get; set; }
    public int TodayOrders { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public int TotalProducts { get; set; }
    public int LowStockCount { get; set; }
    public int TotalCustomers { get; set; }
    public decimal PendingCustomerPayments { get; set; }
}

public class SalesTrendItemDto
{
    public string Date { get; set; } = string.Empty; // YYYY-MM-DD
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
}

public class RevenueVsPurchaseItemDto
{
    public string Month { get; set; } = string.Empty; // e.g. "Jan", "Feb" or "Week 1"
    public decimal Sales { get; set; }
    public decimal Purchases { get; set; }
    public decimal Profit { get; set; }
}

public class TopProductItemDto
{
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int UnitsSold { get; set; }
    public decimal Revenue { get; set; }
}

public class InventoryOverviewDto
{
    public int InStockCount { get; set; }
    public int LowStockCount { get; set; }
    public int OutOfStockCount { get; set; }
    public decimal TotalStockValue { get; set; }
}

public class RecentSaleItemDto
{
    public string Id { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string PaymentStatus { get; set; } = "Paid";
    public DateTime Date { get; set; }
}

public class LowStockAlertItemDto
{
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public int MinimumStock { get; set; }
    public int SuggestedOrderQuantity { get; set; }
    public decimal PurchasePrice { get; set; }
}

public class UpcomingFestivalHighlightDto
{
    public string Name { get; set; } = string.Empty;
    public int DaysRemaining { get; set; }
    public DateTime StartDate { get; set; }
    public List<string> RelevantCategories { get; set; } = new();
    public double DemandMultiplier { get; set; }
    public string Suggestion { get; set; } = string.Empty;
}

public class DashboardSummaryDto
{
    public KpiSummaryDto Kpis { get; set; } = new();
    public List<SalesTrendItemDto> SalesTrend7Days { get; set; } = new();
    public List<SalesTrendItemDto> SalesTrend30Days { get; set; } = new();
    public List<RevenueVsPurchaseItemDto> RevenueVsPurchases { get; set; } = new();
    public List<TopProductItemDto> TopSellingProducts { get; set; } = new();
    public InventoryOverviewDto InventoryOverview { get; set; } = new();
    public List<RecentSaleItemDto> RecentSales { get; set; } = new();
    public List<LowStockAlertItemDto> LowStockAlerts { get; set; } = new();
    public List<string> AiInsights { get; set; } = new();
    public UpcomingFestivalHighlightDto? UpcomingFestival { get; set; }
}
