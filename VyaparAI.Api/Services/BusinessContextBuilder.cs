using MongoDB.Driver;
using VyaparAI.Api.Data;
using VyaparAI.Api.Models;

namespace VyaparAI.Api.Services;

public class BusinessContextSnapshot
{
    public string BusinessName { get; set; } = string.Empty;
    public decimal TodaySales { get; set; }
    public int TodayOrders { get; set; }
    public decimal TodayProfit { get; set; }
    public decimal MonthSales { get; set; }
    public int MonthOrders { get; set; }
    public decimal MonthProfit { get; set; }
    public int TotalProductsCount { get; set; }
    public int LowStockCount { get; set; }
    public int OutOfStockCount { get; set; }
    public decimal TotalInventoryValue { get; set; }
    public decimal CustomerPendingReceivables { get; set; }
    public List<ProductSalesStat> TopSellingProducts { get; set; } = new();
    public List<ProductSalesStat> SlowMovingProducts { get; set; } = new();
    public List<ProductStockStat> LowStockProducts { get; set; } = new();
    public FestivalEvent? UpcomingFestival { get; set; }
    public int DaysToFestival { get; set; }
}

public class ProductSalesStat
{
    public string ProductId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int UnitsSold { get; set; }
    public decimal Revenue { get; set; }
    public int CurrentStock { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal SellingPrice { get; set; }
}

public class ProductStockStat
{
    public string ProductId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public int MinimumStock { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal SellingPrice { get; set; }
    public string? SupplierId { get; set; }
    public string? SupplierName { get; set; }
}

public class BusinessContextBuilder
{
    private readonly MongoDbContext _db;

    public BusinessContextBuilder(MongoDbContext db)
    {
        _db = db;
    }

    public async Task<BusinessContextSnapshot> BuildSnapshotAsync(string businessId)
    {
        var now = DateTime.UtcNow;
        var startOfToday = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var thirtyDaysAgo = now.AddDays(-30).Date;

        var business = await _db.Businesses.Find(b => b.Id == businessId).FirstOrDefaultAsync();
        var products = await _db.Products.Find(p => p.BusinessId == businessId && p.IsActive).ToListAsync();
        var suppliers = await _db.Suppliers.Find(s => s.BusinessId == businessId).ToListAsync();
        var customers = await _db.Customers.Find(c => c.BusinessId == businessId).ToListAsync();

        var supplierMap = suppliers.ToDictionary(s => s.Id, s => s.SupplierName);
        var productMap = products.ToDictionary(p => p.Id);

        var sales30Days = await _db.Sales
            .Find(s => s.BusinessId == businessId && s.CreatedAt >= thirtyDaysAgo)
            .ToListAsync();

        var todaySalesList = sales30Days.Where(s => s.CreatedAt >= startOfToday).ToList();
        var monthSalesList = sales30Days.Where(s => s.CreatedAt >= startOfMonth).ToList();

        decimal todaySales = todaySalesList.Sum(s => s.GrandTotal);
        int todayOrders = todaySalesList.Count;

        decimal todayProfit = 0;
        foreach (var sale in todaySalesList)
        {
            foreach (var item in sale.Items)
            {
                var cost = productMap.TryGetValue(item.ProductId, out var prod) ? prod.PurchasePrice : item.UnitPrice * 0.70m;
                todayProfit += Math.Max(0, item.TotalAmount - (item.Quantity * cost));
            }
        }

        decimal monthSales = monthSalesList.Sum(s => s.GrandTotal);
        int monthOrders = monthSalesList.Count;
        decimal monthProfit = 0;
        foreach (var sale in monthSalesList)
        {
            foreach (var item in sale.Items)
            {
                var cost = productMap.TryGetValue(item.ProductId, out var prod) ? prod.PurchasePrice : item.UnitPrice * 0.70m;
                monthProfit += Math.Max(0, item.TotalAmount - (item.Quantity * cost));
            }
        }

        // Product sales statistics in last 30 days
        var itemCounts = new Dictionary<string, (int qty, decimal rev)>();
        foreach (var s in sales30Days)
        {
            foreach (var i in s.Items)
            {
                if (!itemCounts.ContainsKey(i.ProductId))
                    itemCounts[i.ProductId] = (0, 0);
                var (q, r) = itemCounts[i.ProductId];
                itemCounts[i.ProductId] = (q + i.Quantity, r + i.TotalAmount);
            }
        }

        var topProducts = itemCounts
            .OrderByDescending(kv => kv.Value.rev)
            .Take(8)
            .Select(kv =>
            {
                var prod = productMap.TryGetValue(kv.Key, out var p) ? p : null;
                return new ProductSalesStat
                {
                    ProductId = kv.Key,
                    Name = prod?.Name ?? "Product",
                    Category = prod?.Category ?? "General",
                    UnitsSold = kv.Value.qty,
                    Revenue = kv.Value.rev,
                    CurrentStock = prod?.CurrentQuantity ?? 0,
                    PurchasePrice = prod?.PurchasePrice ?? 0,
                    SellingPrice = prod?.SellingPrice ?? 0
                };
            })
            .ToList();

        // Slow moving: in catalog, but sold < 5 units in 30 days
        var slowProducts = products
            .Where(p => !itemCounts.ContainsKey(p.Id) || itemCounts[p.Id].qty <= 3)
            .Take(6)
            .Select(p => new ProductSalesStat
            {
                ProductId = p.Id,
                Name = p.Name,
                Category = p.Category,
                UnitsSold = itemCounts.TryGetValue(p.Id, out var stat) ? stat.qty : 0,
                Revenue = itemCounts.TryGetValue(p.Id, out var stat2) ? stat2.rev : 0,
                CurrentStock = p.CurrentQuantity,
                PurchasePrice = p.PurchasePrice,
                SellingPrice = p.SellingPrice
            })
            .ToList();

        var lowStockList = products
            .Where(p => p.CurrentQuantity <= p.MinimumStockLevel)
            .OrderBy(p => p.CurrentQuantity)
            .Select(p => new ProductStockStat
            {
                ProductId = p.Id,
                Name = p.Name,
                Category = p.Category,
                CurrentStock = p.CurrentQuantity,
                MinimumStock = p.MinimumStockLevel,
                PurchasePrice = p.PurchasePrice,
                SellingPrice = p.SellingPrice,
                SupplierId = p.SupplierId,
                SupplierName = p.SupplierId != null && supplierMap.TryGetValue(p.SupplierId, out var sn) ? sn : null
            })
            .ToList();

        var upcomingFestival = await _db.FestivalEvents
            .Find(f => f.StartDate >= now.AddDays(-2) || (f.StartDate <= now && f.EndDate >= now))
            .SortBy(f => f.StartDate)
            .FirstOrDefaultAsync();

        int daysToFest = 0;
        if (upcomingFestival != null)
        {
            daysToFest = (int)Math.Ceiling((upcomingFestival.StartDate - now).TotalDays);
            if (daysToFest < 0) daysToFest = 0;
        }

        return new BusinessContextSnapshot
        {
            BusinessName = business?.BusinessName ?? "My Retail Store",
            TodaySales = Math.Round(todaySales, 2),
            TodayOrders = todayOrders,
            TodayProfit = Math.Round(todayProfit, 2),
            MonthSales = Math.Round(monthSales, 2),
            MonthOrders = monthOrders,
            MonthProfit = Math.Round(monthProfit, 2),
            TotalProductsCount = products.Count,
            LowStockCount = lowStockList.Count(p => p.CurrentStock > 0),
            OutOfStockCount = lowStockList.Count(p => p.CurrentStock <= 0),
            TotalInventoryValue = Math.Round(products.Sum(p => (decimal)p.CurrentQuantity * p.PurchasePrice), 2),
            CustomerPendingReceivables = Math.Round(customers.Sum(c => c.PendingAmount), 2),
            TopSellingProducts = topProducts,
            SlowMovingProducts = slowProducts,
            LowStockProducts = lowStockList,
            UpcomingFestival = upcomingFestival,
            DaysToFestival = daysToFest
        };
    }
}
