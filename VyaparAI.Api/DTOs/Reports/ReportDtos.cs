namespace VyaparAI.Api.DTOs.Reports;

public class SalesReportItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public decimal Subtotal { get; set; }
    public decimal GstTotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string PaymentStatus { get; set; } = "Paid";
}

public class SalesReportSummaryDto
{
    public decimal TotalRevenue { get; set; }
    public decimal TotalTaxCollected { get; set; }
    public decimal TotalDiscountGiven { get; set; }
    public int TotalOrders { get; set; }
    public decimal AverageOrderValue { get; set; }
    public List<SalesReportItemDto> Items { get; set; } = new();
}

public class PurchaseReportItemDto
{
    public string Date { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public decimal Subtotal { get; set; }
    public decimal GstTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal PendingAmount { get; set; }
}

public class PurchaseReportSummaryDto
{
    public decimal TotalPurchases { get; set; }
    public decimal TotalTaxPaid { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal TotalPending { get; set; }
    public int TotalPurchaseOrders { get; set; }
    public List<PurchaseReportItemDto> Items { get; set; } = new();
}

public class ProfitReportDto
{
    public decimal TotalRevenue { get; set; }
    public decimal TotalCostOfGoodsSold { get; set; }
    public decimal GrossProfit { get; set; }
    public decimal ProfitMarginPercentage { get; set; }
    public List<ProfitBreakdownItemDto> DailyBreakdown { get; set; } = new();
}

public class ProfitBreakdownItemDto
{
    public string Date { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public decimal Cost { get; set; }
    public decimal Profit { get; set; }
    public decimal MarginPercent { get; set; }
}

public class InventoryReportItemDto
{
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int CurrentQuantity { get; set; }
    public int MinimumStockLevel { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal StockValue { get; set; }
    public string Status { get; set; } = "IN STOCK";
}

public class InventoryReportSummaryDto
{
    public int TotalProducts { get; set; }
    public int InStockCount { get; set; }
    public int LowStockCount { get; set; }
    public int OutOfStockCount { get; set; }
    public decimal TotalStockValue { get; set; }
    public List<InventoryReportItemDto> Items { get; set; } = new();
}

public class CustomerReportItemDto
{
    public string CustomerId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public decimal TotalPurchases { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal PendingAmount { get; set; }
    public int OrderCount { get; set; }
    public DateTime? LastPurchaseDate { get; set; }
}

public class CustomerReportSummaryDto
{
    public int TotalCustomers { get; set; }
    public decimal TotalRevenueFromCustomers { get; set; }
    public decimal TotalPendingReceivables { get; set; }
    public List<CustomerReportItemDto> Items { get; set; } = new();
}
