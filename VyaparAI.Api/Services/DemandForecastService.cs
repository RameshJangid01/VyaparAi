using MongoDB.Driver;
using VyaparAI.Api.Data;
using VyaparAI.Api.DTOs.AI;

namespace VyaparAI.Api.Services;

public class DemandForecastService
{
    private readonly MongoDbContext _db;

    public DemandForecastService(MongoDbContext db)
    {
        _db = db;
    }

    public async Task<ForecastResponseDto> CalculateForecastAsync(string businessId)
    {
        var now = DateTime.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30).Date;

        var products = await _db.Products
            .Find(p => p.BusinessId == businessId && p.IsActive)
            .ToListAsync();

        var sales30Days = await _db.Sales
            .Find(s => s.BusinessId == businessId && s.CreatedAt >= thirtyDaysAgo)
            .ToListAsync();

        var upcomingFestival = await _db.FestivalEvents
            .Find(f => f.StartDate >= now.AddDays(-2) || (f.StartDate <= now && f.EndDate >= now))
            .SortBy(f => f.StartDate)
            .FirstOrDefaultAsync();

        var itemSalesVolume = new Dictionary<string, int>();
        foreach (var sale in sales30Days)
        {
            foreach (var item in sale.Items)
            {
                if (!itemSalesVolume.ContainsKey(item.ProductId))
                    itemSalesVolume[item.ProductId] = 0;
                itemSalesVolume[item.ProductId] += item.Quantity;
            }
        }

        var forecasts = new List<ProductForecastDto>();

        foreach (var product in products)
        {
            itemSalesVolume.TryGetValue(product.Id, out var soldIn30Days);

            // Baseline daily sales rate
            double dailyRate = soldIn30Days > 0 ? (double)soldIn30Days / 30.0 : 0.2;

            // Apply festival multiplier if relevant
            double multiplier = 1.0;
            if (upcomingFestival != null &&
                upcomingFestival.RelevantCategories.Any(c => string.Equals(c, product.Category, StringComparison.OrdinalIgnoreCase)))
            {
                multiplier = upcomingFestival.DemandMultiplier;
            }

            double adjustedDailyRate = dailyRate * multiplier;
            int demand15 = (int)Math.Ceiling(adjustedDailyRate * 15);
            int demand30 = (int)Math.Ceiling(adjustedDailyRate * 30);

            int recommendedReorder = Math.Max(0, (demand30 + product.MinimumStockLevel) - product.CurrentQuantity);
            decimal estimatedCost = recommendedReorder * product.PurchasePrice;

            string urgency = product.CurrentQuantity <= 0 ? "High"
                           : product.CurrentQuantity <= product.MinimumStockLevel ? "High"
                           : product.CurrentQuantity < demand15 ? "Medium"
                           : "Low";

            forecasts.Add(new ProductForecastDto
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Category = product.Category,
                CurrentStock = product.CurrentQuantity,
                AverageDailySales = (int)Math.Round(dailyRate),
                ForecastedDemandNext15Days = demand15,
                ForecastedDemandNext30Days = demand30,
                RecommendedReorderQuantity = recommendedReorder,
                EstimatedCost = Math.Round(estimatedCost, 2),
                FestivalMultiplier = multiplier,
                Urgency = urgency
            });
        }

        var daysToFest = 0;
        if (upcomingFestival != null)
        {
            daysToFest = (int)Math.Ceiling((upcomingFestival.StartDate - now).TotalDays);
            if (daysToFest < 0) daysToFest = 0;
        }

        return new ForecastResponseDto
        {
            UpcomingFestival = upcomingFestival?.Name ?? "None within 30 days",
            DaysToFestival = daysToFest,
            Forecasts = forecasts.OrderByDescending(f => f.Urgency == "High")
                                 .ThenByDescending(f => f.RecommendedReorderQuantity)
                                 .ToList()
        };
    }
}
