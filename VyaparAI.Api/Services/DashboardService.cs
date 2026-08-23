using MongoDB.Driver;
using VyaparAI.Api.Data;
using VyaparAI.Api.DTOs.Dashboard;
using VyaparAI.Api.Interfaces;
using VyaparAI.Api.Models;

namespace VyaparAI.Api.Services;

public class DashboardService : IDashboardService
{
    private readonly MongoDbContext _db;

    public DashboardService(MongoDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(string businessId)
    {
        var now = DateTime.UtcNow;
        var startOfToday = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var thirtyDaysAgo = now.AddDays(-30).Date;
        var sevenDaysAgo = now.AddDays(-7).Date;

        // Fetch products
        var products = await _db.Products
            .Find(p => p.BusinessId == businessId && p.IsActive)
            .ToListAsync();

        var productMap = products.ToDictionary(p => p.Id);

        var inStockCount = products.Count(p => p.CurrentQuantity > p.MinimumStockLevel);
        var lowStockCount = products.Count(p => p.CurrentQuantity > 0 && p.CurrentQuantity <= p.MinimumStockLevel);
        var outOfStockCount = products.Count(p => p.CurrentQuantity <= 0);
        var totalStockValue = products.Sum(p => (decimal)p.CurrentQuantity * p.PurchasePrice);

        // Fetch sales in last 30 days
        var sales30Days = await _db.Sales
            .Find(s => s.BusinessId == businessId && s.CreatedAt >= thirtyDaysAgo)
            .SortByDescending(s => s.CreatedAt)
            .ToListAsync();

        // Today sales & profit
        var todaySalesList = sales30Days.Where(s => s.CreatedAt >= startOfToday).ToList();
        var todaySalesTotal = todaySalesList.Sum(s => s.GrandTotal);
        var todayOrdersCount = todaySalesList.Count;

        decimal todayProfit = 0;
        foreach (var sale in todaySalesList)
        {
            foreach (var item in sale.Items)
            {
                var costPrice = productMap.TryGetValue(item.ProductId, out var prod) ? prod.PurchasePrice : item.UnitPrice * 0.75m;
                var itemRevenue = item.TotalAmount;
                var itemCost = item.Quantity * costPrice;
                todayProfit += Math.Max(0, itemRevenue - itemCost);
            }
        }

        // Monthly revenue
        var monthlySalesList = sales30Days.Where(s => s.CreatedAt >= startOfMonth).ToList();
        var monthlyRevenue = monthlySalesList.Sum(s => s.GrandTotal);

        // Fetch customers for metrics
        var customers = await _db.Customers
            .Find(c => c.BusinessId == businessId)
            .ToListAsync();

        var totalCustomers = customers.Count;
        var pendingCustomerPayments = customers.Sum(c => c.PendingAmount);

        // Purchases in last 30 days
        var purchases30Days = await _db.Purchases
            .Find(p => p.BusinessId == businessId && p.PurchaseDate >= thirtyDaysAgo)
            .ToListAsync();

        // 7-day and 30-day sales trends
        var salesTrend7Days = new List<SalesTrendItemDto>();
        for (int i = 6; i >= 0; i--)
        {
            var day = now.AddDays(-i).Date;
            var dayEnd = day.AddDays(1).AddTicks(-1);
            var daySales = sales30Days.Where(s => s.CreatedAt >= day && s.CreatedAt <= dayEnd).ToList();
            salesTrend7Days.Add(new SalesTrendItemDto
            {
                Date = day.ToString("yyyy-MM-dd"),
                Revenue = daySales.Sum(s => s.GrandTotal),
                Orders = daySales.Count
            });
        }

        var salesTrend30Days = new List<SalesTrendItemDto>();
        for (int i = 29; i >= 0; i--)
        {
            var day = now.AddDays(-i).Date;
            var dayEnd = day.AddDays(1).AddTicks(-1);
            var daySales = sales30Days.Where(s => s.CreatedAt >= day && s.CreatedAt <= dayEnd).ToList();
            salesTrend30Days.Add(new SalesTrendItemDto
            {
                Date = day.ToString("yyyy-MM-dd"),
                Revenue = daySales.Sum(s => s.GrandTotal),
                Orders = daySales.Count
            });
        }

        // Revenue vs Purchases (grouped into 4 weekly buckets)
        var revenueVsPurchases = new List<RevenueVsPurchaseItemDto>();
        for (int w = 3; w >= 0; w--)
        {
            var weekStart = now.AddDays(-((w + 1) * 7)).Date;
            var weekEnd = now.AddDays(-(w * 7)).Date;
            var weekSales = sales30Days.Where(s => s.CreatedAt >= weekStart && s.CreatedAt < weekEnd).Sum(s => s.GrandTotal);
            var weekPurchases = purchases30Days.Where(p => p.PurchaseDate >= weekStart && p.PurchaseDate < weekEnd).Sum(p => p.GrandTotal);
            var weekProfit = Math.Max(0, weekSales - (weekPurchases * 0.85m));

            revenueVsPurchases.Add(new RevenueVsPurchaseItemDto
            {
                Month = w == 0 ? "This Week" : $"Week -{w}",
                Sales = weekSales,
                Purchases = weekPurchases,
                Profit = Math.Round(weekProfit, 2)
            });
        }

        // Top selling products
        var productSalesStats = new Dictionary<string, (int units, decimal revenue)>();
        foreach (var sale in sales30Days)
        {
            foreach (var item in sale.Items)
            {
                if (!productSalesStats.ContainsKey(item.ProductId))
                    productSalesStats[item.ProductId] = (0, 0);

                var (u, r) = productSalesStats[item.ProductId];
                productSalesStats[item.ProductId] = (u + item.Quantity, r + item.TotalAmount);
            }
        }

        var topSellingProducts = productSalesStats
            .OrderByDescending(kv => kv.Value.revenue)
            .Take(5)
            .Select(kv =>
            {
                var prod = productMap.TryGetValue(kv.Key, out var p) ? p : null;
                return new TopProductItemDto
                {
                    ProductId = kv.Key,
                    ProductName = prod?.Name ?? "Product",
                    Category = prod?.Category ?? "General",
                    UnitsSold = kv.Value.units,
                    Revenue = Math.Round(kv.Value.revenue, 2)
                };
            })
            .ToList();

        // Recent sales
        var recentSales = sales30Days
            .Take(6)
            .Select(s => new RecentSaleItemDto
            {
                Id = s.Id,
                InvoiceNumber = s.InvoiceNumber,
                CustomerName = s.CustomerName ?? "Walk-in Customer",
                Amount = s.GrandTotal,
                PaymentMethod = s.PaymentMethod,
                PaymentStatus = s.PaymentStatus,
                Date = s.CreatedAt
            })
            .ToList();

        // Low stock alerts
        var lowStockAlerts = products
            .Where(p => p.CurrentQuantity <= p.MinimumStockLevel)
            .OrderBy(p => p.CurrentQuantity)
            .Take(8)
            .Select(p => new LowStockAlertItemDto
            {
                ProductId = p.Id,
                ProductName = p.Name,
                Sku = p.Sku,
                CurrentStock = p.CurrentQuantity,
                MinimumStock = p.MinimumStockLevel,
                SuggestedOrderQuantity = Math.Max(10, (p.MinimumStockLevel * 2) - p.CurrentQuantity),
                PurchasePrice = p.PurchasePrice
            })
            .ToList();

        // Dynamic AI Insights based on real figures
        var aiInsights = new List<string>();
        if (lowStockCount > 0)
            aiInsights.Add($"⚠️ {lowStockCount} product{(lowStockCount > 1 ? "s are" : " is")} running critically low on stock. Order replenishment to prevent stockouts.");

        if (topSellingProducts.Count > 0)
            aiInsights.Add($"🔥 '{topSellingProducts[0].ProductName}' is your #1 revenue generator ({topSellingProducts[0].UnitsSold} units sold this month).");

        if (pendingCustomerPayments > 0)
            aiInsights.Add($"💰 Outstanding customer receivables total ₹{pendingCustomerPayments:N0}. Consider sending payment reminders.");

        if (todaySalesTotal > 0)
            aiInsights.Add($"📈 Today's gross profit is estimated at ₹{todayProfit:N0} across {todayOrdersCount} orders.");
        else
            aiInsights.Add("📊 Record your first sale today to track real-time velocity and margin.");

        // Upcoming festival check
        var upcomingFestivalRecord = await _db.FestivalEvents
            .Find(f => f.StartDate >= now.AddDays(-2) || (f.StartDate <= now && f.EndDate >= now))
            .SortBy(f => f.StartDate)
            .FirstOrDefaultAsync();

        UpcomingFestivalHighlightDto? upcomingFestival = null;
        if (upcomingFestivalRecord != null)
        {
            var daysRemaining = (int)Math.Ceiling((upcomingFestivalRecord.StartDate - now).TotalDays);
            if (daysRemaining < 0) daysRemaining = 0;

            var cats = string.Join(", ", upcomingFestivalRecord.RelevantCategories);
            upcomingFestival = new UpcomingFestivalHighlightDto
            {
                Name = upcomingFestivalRecord.Name,
                DaysRemaining = daysRemaining,
                StartDate = upcomingFestivalRecord.StartDate,
                RelevantCategories = upcomingFestivalRecord.RelevantCategories,
                DemandMultiplier = upcomingFestivalRecord.DemandMultiplier,
                Suggestion = $"{upcomingFestivalRecord.Name} demand surge anticipated (+{(int)((upcomingFestivalRecord.DemandMultiplier - 1.0) * 100)}%). Stock up on: {cats}."
            };

            aiInsights.Add($"🎉 {upcomingFestivalRecord.Name} is coming up! Demand for {cats} is projected to rise {upcomingFestivalRecord.DemandMultiplier}x.");
        }

        return new DashboardSummaryDto
        {
            Kpis = new KpiSummaryDto
            {
                TodaySales = Math.Round(todaySalesTotal, 2),
                TodayProfit = Math.Round(todayProfit, 2),
                TodayOrders = todayOrdersCount,
                MonthlyRevenue = Math.Round(monthlyRevenue, 2),
                TotalProducts = products.Count,
                LowStockCount = lowStockCount,
                TotalCustomers = totalCustomers,
                PendingCustomerPayments = Math.Round(pendingCustomerPayments, 2)
            },
            SalesTrend7Days = salesTrend7Days,
            SalesTrend30Days = salesTrend30Days,
            RevenueVsPurchases = revenueVsPurchases,
            TopSellingProducts = topSellingProducts,
            InventoryOverview = new InventoryOverviewDto
            {
                InStockCount = inStockCount,
                LowStockCount = lowStockCount,
                OutOfStockCount = outOfStockCount,
                TotalStockValue = Math.Round(totalStockValue, 2)
            },
            RecentSales = recentSales,
            LowStockAlerts = lowStockAlerts,
            AiInsights = aiInsights,
            UpcomingFestival = upcomingFestival
        };
    }
}
