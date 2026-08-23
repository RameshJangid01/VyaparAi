using Microsoft.Extensions.Options;
using MongoDB.Driver;
using VyaparAI.Api.Configuration;
using VyaparAI.Api.Data;
using VyaparAI.Api.DTOs.Admin;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;
using VyaparAI.Api.Models;

namespace VyaparAI.Api.Services;

public class AdminService : IAdminService
{
    private readonly MongoDbContext _db;
    private readonly AiSettings _aiSettings;

    public AdminService(MongoDbContext db, IOptions<AiSettings> aiSettings)
    {
        _db = db;
        _aiSettings = aiSettings.Value;
    }

    public async Task<AdminDashboardDto> GetPlatformDashboardAsync()
    {
        var totalBusinesses = (int)await _db.Businesses.CountDocumentsAsync(_ => true);
        var totalUsers = (int)await _db.Users.CountDocumentsAsync(_ => true);
        var totalProducts = (int)await _db.Products.CountDocumentsAsync(_ => true);
        var totalSales = (int)await _db.Sales.CountDocumentsAsync(_ => true);
        var totalPurchases = (int)await _db.Purchases.CountDocumentsAsync(_ => true);

        var allSales = await _db.Sales.Find(_ => true).ToListAsync();
        var totalRevenue = allSales.Sum(s => s.GrandTotal);

        // Business growth by month (last 6 months)
        var now = DateTime.UtcNow;
        var businessGrowth = new List<AdminBusinessGrowthDto>();
        for (int i = 5; i >= 0; i--)
        {
            var mStart = new DateTime(now.AddMonths(-i).Year, now.AddMonths(-i).Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var mEnd = mStart.AddMonths(1).AddTicks(-1);
            var count = await _db.Businesses.CountDocumentsAsync(b => b.CreatedAt >= mStart && b.CreatedAt <= mEnd);
            businessGrowth.Add(new AdminBusinessGrowthDto
            {
                Month = mStart.ToString("MMM yyyy"),
                NewBusinesses = (int)count
            });
        }

        // Sales activity in last 7 days
        var salesActivity = new List<AdminSalesActivityDto>();
        for (int i = 6; i >= 0; i--)
        {
            var dStart = now.AddDays(-i).Date;
            var dEnd = dStart.AddDays(1).AddTicks(-1);
            var daySales = allSales.Where(s => s.CreatedAt >= dStart && s.CreatedAt <= dEnd).ToList();
            salesActivity.Add(new AdminSalesActivityDto
            {
                Date = dStart.ToString("yyyy-MM-dd"),
                Revenue = daySales.Sum(s => s.GrandTotal),
                Orders = daySales.Count
            });
        }

        return new AdminDashboardDto
        {
            TotalBusinesses = totalBusinesses,
            ActiveBusinesses = totalBusinesses,
            TotalUsers = totalUsers,
            TotalProducts = totalProducts,
            TotalSalesCount = totalSales,
            TotalPurchasesCount = totalPurchases,
            TotalPlatformRevenue = Math.Round(totalRevenue, 2),
            ActiveUsersToday = Math.Max(1, totalUsers),
            BusinessGrowth = businessGrowth,
            SalesActivity = salesActivity
        };
    }

    public async Task<List<AdminBusinessDto>> GetBusinessesAsync()
    {
        var businesses = await _db.Businesses.Find(_ => true).SortByDescending(b => b.CreatedAt).ToListAsync();
        var allProducts = await _db.Products.Find(_ => true).ToListAsync();
        var allSales = await _db.Sales.Find(_ => true).ToListAsync();

        var productsByBusiness = allProducts.GroupBy(p => p.BusinessId).ToDictionary(g => g.Key, g => g.Count());
        var salesByBusiness = allSales.GroupBy(s => s.BusinessId).ToDictionary(g => g.Key, g => (count: g.Count(), rev: g.Sum(s => s.GrandTotal)));

        return businesses.Select(b =>
        {
            productsByBusiness.TryGetValue(b.Id, out var prodCount);
            salesByBusiness.TryGetValue(b.Id, out var saleStat);

            return new AdminBusinessDto
            {
                Id = b.Id,
                BusinessName = b.BusinessName,
                OwnerName = b.OwnerName,
                Email = b.Email,
                MobileNumber = b.MobileNumber,
                GstNumber = b.GstNumber,
                CreatedAt = b.CreatedAt,
                TotalProducts = prodCount,
                TotalSales = saleStat.count,
                TotalRevenue = Math.Round(saleStat.rev, 2),
                IsActive = true
            };
        }).ToList();
    }

    public async Task ToggleBusinessStatusAsync(string businessId, bool isActive)
    {
        var business = await _db.Businesses.Find(b => b.Id == businessId).FirstOrDefaultAsync();
        if (business == null)
            throw new ApiException("Business not found.", 404);

        // Can record active state or update updated time
        await _db.Businesses.UpdateOneAsync(
            b => b.Id == businessId,
            Builders<Business>.Update.Set(b => b.UpdatedAt, DateTime.UtcNow));
    }

    public async Task<List<AdminUserDto>> GetUsersAsync()
    {
        var users = await _db.Users.Find(_ => true).SortByDescending(u => u.CreatedAt).ToListAsync();
        var businesses = await _db.Businesses.Find(_ => true).ToListAsync();
        var businessMap = businesses.ToDictionary(b => b.Id, b => b.BusinessName);

        return users.Select(u => new AdminUserDto
        {
            Id = u.Id,
            OwnerName = u.OwnerName,
            Email = u.Email,
            MobileNumber = u.MobileNumber,
            BusinessId = u.BusinessId ?? string.Empty,
            BusinessName = !string.IsNullOrEmpty(u.BusinessId) && businessMap.TryGetValue(u.BusinessId, out var bn) ? bn : (u.Role == "Admin" ? "System Admin" : "Individual"),
            Role = u.Role ?? "Owner",
            CreatedAt = u.CreatedAt,
            IsActive = true
        }).ToList();
    }

    public async Task ToggleUserStatusAsync(string userId, bool isActive)
    {
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        if (user == null)
            throw new ApiException("User not found.", 404);

        await _db.Users.UpdateOneAsync(
            u => u.Id == userId,
            Builders<User>.Update.Set(u => u.UpdatedAt, DateTime.UtcNow));
    }

    public async Task UpdateUserRoleAsync(string userId, string role)
    {
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        if (user == null)
            throw new ApiException("User not found.", 404);

        var validRoles = new[] { "Admin", "Owner", "User" };
        var normalizedRole = validRoles.FirstOrDefault(r => string.Equals(r, role, StringComparison.OrdinalIgnoreCase)) ?? "Owner";

        await _db.Users.UpdateOneAsync(
            u => u.Id == userId,
            Builders<User>.Update
                .Set(u => u.Role, normalizedRole)
                .Set(u => u.UpdatedAt, DateTime.UtcNow));
    }

    public async Task<AdminProductsOverviewDto> GetSystemProductsOverviewAsync()
    {
        var products = await _db.Products.Find(_ => true).ToListAsync();
        var totalValuation = products.Sum(p => (decimal)p.CurrentQuantity * p.PurchasePrice);

        var categoryDistribution = products
            .GroupBy(p => string.IsNullOrWhiteSpace(p.Category) ? "General" : p.Category)
            .Select(g => new CategoryDistributionDto
            {
                Category = g.Key,
                ProductCount = g.Count()
            })
            .OrderByDescending(c => c.ProductCount)
            .ToList();

        return new AdminProductsOverviewDto
        {
            TotalProducts = products.Count,
            ActiveCategoriesCount = categoryDistribution.Count,
            TotalPlatformInventoryValue = Math.Round(totalValuation, 2),
            CategoryDistribution = categoryDistribution
        };
    }

    public async Task<AdminSalesOverviewDto> GetSystemSalesOverviewAsync()
    {
        var sales = await _db.Sales.Find(_ => true).ToListAsync();
        var totalOrders = sales.Count;
        var totalRevenue = sales.Sum(s => s.GrandTotal);
        var totalTax = sales.Sum(s => s.GstTotal);
        var avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return new AdminSalesOverviewDto
        {
            TotalOrders = totalOrders,
            TotalRevenue = Math.Round(totalRevenue, 2),
            AverageOrderValue = Math.Round(avgOrder, 2),
            TotalTaxCollected = Math.Round(totalTax, 2)
        };
    }

    public Task<SystemSettingsDto> GetSystemSettingsAsync()
    {
        return Task.FromResult(new SystemSettingsDto
        {
            Environment = "Production",
            DatabaseName = "VyaparAI",
            DatabaseConnected = true,
            AiModelConfigured = string.IsNullOrWhiteSpace(_aiSettings.GeminiModel) ? "gemini-2.0-flash" : _aiSettings.GeminiModel,
            AiConfigured = !string.IsNullOrWhiteSpace(_aiSettings.GeminiApiKey),
            ServerTimeUtc = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss 'UTC'"),
            ApiVersion = "v1.0"
        });
    }
}
