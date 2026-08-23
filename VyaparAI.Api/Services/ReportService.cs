using MongoDB.Driver;
using VyaparAI.Api.Data;
using VyaparAI.Api.DTOs.Reports;
using VyaparAI.Api.Interfaces;
using VyaparAI.Api.Models;

namespace VyaparAI.Api.Services;

public class ReportService : IReportService
{
    private readonly MongoDbContext _db;

    public ReportService(MongoDbContext db)
    {
        _db = db;
    }

    public async Task<SalesReportSummaryDto> GetSalesReportAsync(string businessId, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var filterBuilder = Builders<Sale>.Filter;
        var filter = filterBuilder.Eq(s => s.BusinessId, businessId);

        if (fromDate.HasValue)
            filter &= filterBuilder.Gte(s => s.CreatedAt, fromDate.Value.Date);

        if (toDate.HasValue)
            filter &= filterBuilder.Lte(s => s.CreatedAt, toDate.Value.Date.AddDays(1).AddTicks(-1));

        var sales = await _db.Sales
            .Find(filter)
            .SortByDescending(s => s.CreatedAt)
            .ToListAsync();

        var items = sales.Select(s => new SalesReportItemDto
        {
            Id = s.Id,
            Date = s.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
            InvoiceNumber = s.InvoiceNumber,
            CustomerName = s.CustomerName ?? "Walk-in Customer",
            TotalItems = s.Items.Sum(i => i.Quantity),
            Subtotal = s.Subtotal,
            GstTotal = s.GstTotal,
            DiscountTotal = s.DiscountTotal,
            GrandTotal = s.GrandTotal,
            PaymentMethod = s.PaymentMethod,
            PaymentStatus = s.PaymentStatus
        }).ToList();

        var totalRevenue = items.Sum(i => i.GrandTotal);
        var totalTax = items.Sum(i => i.GstTotal);
        var totalDiscount = items.Sum(i => i.DiscountTotal);
        var totalOrders = items.Count;
        var averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return new SalesReportSummaryDto
        {
            TotalRevenue = Math.Round(totalRevenue, 2),
            TotalTaxCollected = Math.Round(totalTax, 2),
            TotalDiscountGiven = Math.Round(totalDiscount, 2),
            TotalOrders = totalOrders,
            AverageOrderValue = Math.Round(averageOrderValue, 2),
            Items = items
        };
    }

    public async Task<PurchaseReportSummaryDto> GetPurchaseReportAsync(string businessId, DateTime? fromDate = null, DateTime? toDate = null, string? supplierId = null)
    {
        var filterBuilder = Builders<Purchase>.Filter;
        var filter = filterBuilder.Eq(p => p.BusinessId, businessId);

        if (!string.IsNullOrEmpty(supplierId))
            filter &= filterBuilder.Eq(p => p.SupplierId, supplierId);

        if (fromDate.HasValue)
            filter &= filterBuilder.Gte(p => p.PurchaseDate, fromDate.Value.Date);

        if (toDate.HasValue)
            filter &= filterBuilder.Lte(p => p.PurchaseDate, toDate.Value.Date.AddDays(1).AddTicks(-1));

        var purchases = await _db.Purchases
            .Find(filter)
            .SortByDescending(p => p.PurchaseDate)
            .ToListAsync();

        var items = purchases.Select(p => new PurchaseReportItemDto
        {
            Date = p.PurchaseDate.ToString("yyyy-MM-dd"),
            InvoiceNumber = p.InvoiceNumber,
            SupplierName = p.SupplierName,
            TotalItems = p.Items.Sum(i => i.Quantity),
            Subtotal = p.Subtotal,
            GstTotal = p.GstTotal,
            GrandTotal = p.GrandTotal,
            PaidAmount = p.PaidAmount,
            PendingAmount = p.PendingAmount
        }).ToList();

        var totalPurchases = items.Sum(i => i.GrandTotal);
        var totalTax = items.Sum(i => i.GstTotal);
        var totalPaid = items.Sum(i => i.PaidAmount);
        var totalPending = items.Sum(i => i.PendingAmount);

        return new PurchaseReportSummaryDto
        {
            TotalPurchases = Math.Round(totalPurchases, 2),
            TotalTaxPaid = Math.Round(totalTax, 2),
            TotalPaid = Math.Round(totalPaid, 2),
            TotalPending = Math.Round(totalPending, 2),
            TotalPurchaseOrders = items.Count,
            Items = items
        };
    }

    public async Task<ProfitReportDto> GetProfitReportAsync(string businessId, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var start = fromDate?.Date ?? DateTime.UtcNow.AddDays(-30).Date;
        var end = toDate?.Date.AddDays(1).AddTicks(-1) ?? DateTime.UtcNow;

        var sales = await _db.Sales
            .Find(s => s.BusinessId == businessId && s.CreatedAt >= start && s.CreatedAt <= end)
            .ToListAsync();

        var products = await _db.Products
            .Find(p => p.BusinessId == businessId)
            .ToListAsync();

        var productMap = products.ToDictionary(p => p.Id);

        decimal totalRevenue = 0;
        decimal totalCost = 0;
        var dailyMap = new Dictionary<string, (decimal rev, decimal cost)>();

        foreach (var sale in sales)
        {
            var dayKey = sale.CreatedAt.ToString("yyyy-MM-dd");
            if (!dailyMap.ContainsKey(dayKey))
                dailyMap[dayKey] = (0, 0);

            var (dayRev, dayCost) = dailyMap[dayKey];

            foreach (var item in sale.Items)
            {
                var costPrice = productMap.TryGetValue(item.ProductId, out var prod) ? prod.PurchasePrice : item.UnitPrice * 0.70m;
                var itemRevenue = item.TotalAmount;
                var itemCost = item.Quantity * costPrice;

                totalRevenue += itemRevenue;
                totalCost += itemCost;

                dayRev += itemRevenue;
                dayCost += itemCost;
            }

            dailyMap[dayKey] = (dayRev, dayCost);
        }

        var grossProfit = Math.Max(0, totalRevenue - totalCost);
        var marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        var dailyBreakdown = dailyMap
            .OrderBy(kv => kv.Key)
            .Select(kv =>
            {
                var profit = Math.Max(0, kv.Value.rev - kv.Value.cost);
                var margin = kv.Value.rev > 0 ? (profit / kv.Value.rev) * 100 : 0;
                return new ProfitBreakdownItemDto
                {
                    Date = kv.Key,
                    Revenue = Math.Round(kv.Value.rev, 2),
                    Cost = Math.Round(kv.Value.cost, 2),
                    Profit = Math.Round(profit, 2),
                    MarginPercent = Math.Round(margin, 1)
                };
            })
            .ToList();

        return new ProfitReportDto
        {
            TotalRevenue = Math.Round(totalRevenue, 2),
            TotalCostOfGoodsSold = Math.Round(totalCost, 2),
            GrossProfit = Math.Round(grossProfit, 2),
            ProfitMarginPercentage = Math.Round(marginPercent, 1),
            DailyBreakdown = dailyBreakdown
        };
    }

    public async Task<InventoryReportSummaryDto> GetInventoryReportAsync(string businessId)
    {
        var products = await _db.Products
            .Find(p => p.BusinessId == businessId && p.IsActive)
            .ToListAsync();

        var items = products.Select(p =>
        {
            string status = p.CurrentQuantity <= 0 ? "OUT OF STOCK"
                          : p.CurrentQuantity <= p.MinimumStockLevel ? "LOW STOCK"
                          : "IN STOCK";

            return new InventoryReportItemDto
            {
                ProductId = p.Id,
                ProductName = p.Name,
                Sku = p.Sku,
                Category = p.Category,
                CurrentQuantity = p.CurrentQuantity,
                MinimumStockLevel = p.MinimumStockLevel,
                PurchasePrice = p.PurchasePrice,
                SellingPrice = p.SellingPrice,
                StockValue = Math.Round((decimal)p.CurrentQuantity * p.PurchasePrice, 2),
                Status = status
            };
        }).ToList();

        var inStock = items.Count(i => i.Status == "IN STOCK");
        var lowStock = items.Count(i => i.Status == "LOW STOCK");
        var outOfStock = items.Count(i => i.Status == "OUT OF STOCK");
        var totalValue = items.Sum(i => i.StockValue);

        return new InventoryReportSummaryDto
        {
            TotalProducts = items.Count,
            InStockCount = inStock,
            LowStockCount = lowStock,
            OutOfStockCount = outOfStock,
            TotalStockValue = Math.Round(totalValue, 2),
            Items = items
        };
    }

    public async Task<CustomerReportSummaryDto> GetCustomerReportAsync(string businessId)
    {
        var customers = await _db.Customers
            .Find(c => c.BusinessId == businessId)
            .ToListAsync();

        var customerIds = customers.Select(c => c.Id).ToList();
        var sales = await _db.Sales
            .Find(s => s.BusinessId == businessId && s.CustomerId != null && customerIds.Contains(s.CustomerId))
            .ToListAsync();

        var salesGroup = sales.GroupBy(s => s.CustomerId).ToDictionary(
            g => g.Key!,
            g => (count: g.Count(), lastDate: g.Max(s => (DateTime?)s.CreatedAt))
        );

        var items = customers.Select(c =>
        {
            salesGroup.TryGetValue(c.Id, out var stat);
            return new CustomerReportItemDto
            {
                CustomerId = c.Id,
                Name = c.Name,
                Mobile = c.Mobile,
                TotalPurchases = c.TotalPurchases,
                TotalPaid = c.TotalPaid,
                PendingAmount = c.PendingAmount,
                OrderCount = stat.count,
                LastPurchaseDate = stat.lastDate
            };
        }).ToList();

        var totalRevenue = items.Sum(i => i.TotalPurchases);
        var totalPending = items.Sum(i => i.PendingAmount);

        return new CustomerReportSummaryDto
        {
            TotalCustomers = items.Count,
            TotalRevenueFromCustomers = Math.Round(totalRevenue, 2),
            TotalPendingReceivables = Math.Round(totalPending, 2),
            Items = items
        };
    }
}
