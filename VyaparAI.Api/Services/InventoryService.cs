using MongoDB.Driver;
using VyaparAI.Api.Data;
using VyaparAI.Api.DTOs.Inventory;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;
using VyaparAI.Api.Models;

namespace VyaparAI.Api.Services;

public class InventoryService : IInventoryService
{
    private readonly MongoDbContext _db;
    private readonly ILogger<InventoryService> _logger;

    public InventoryService(MongoDbContext db, ILogger<InventoryService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PagedResult<InventoryItemDto>> GetInventoryOverviewAsync(string businessId, InventoryQueryDto query)
    {
        var builder = Builders<Product>.Filter;
        var filter = builder.Eq(p => p.BusinessId, businessId) & builder.Eq(p => p.IsActive, true);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = new MongoDB.Bson.BsonRegularExpression(query.Search.Trim(), "i");
            filter &= builder.Or(builder.Regex(p => p.Name, pattern), builder.Regex(p => p.Sku, pattern));
        }

        if (!string.IsNullOrWhiteSpace(query.Category))
            filter &= builder.Eq(p => p.Category, query.Category);

        var totalCount = await _db.Products.CountDocumentsAsync(filter);
        var items = await _db.Products.Find(filter)
            .SortBy(p => p.Name)
            .Skip((query.Page - 1) * query.PageSize)
            .Limit(query.PageSize)
            .ToListAsync();

        return PagedResult<InventoryItemDto>.Create(items.Select(ToInventoryItemDto).ToList(), totalCount, query.Page, query.PageSize);
    }

    public async Task<List<InventoryItemDto>> GetLowStockAsync(string businessId)
    {
        var products = await _db.Products
            .Find(p => p.BusinessId == businessId && p.IsActive)
            .ToListAsync();

        return products
            .Where(p => p.CurrentQuantity <= p.MinimumStockLevel)
            .OrderBy(p => p.CurrentQuantity)
            .Select(ToInventoryItemDto)
            .ToList();
    }

    public async Task<InventorySummaryDto> GetSummaryAsync(string businessId)
    {
        var products = await _db.Products
            .Find(p => p.BusinessId == businessId && p.IsActive)
            .ToListAsync();

        return new InventorySummaryDto
        {
            TotalProducts = products.Count,
            LowStockCount = products.Count(p => p.CurrentQuantity > 0 && p.CurrentQuantity <= p.MinimumStockLevel),
            OutOfStockCount = products.Count(p => p.CurrentQuantity <= 0),
            TotalStockValue = products.Sum(p => p.CurrentQuantity * p.PurchasePrice)
        };
    }

    public async Task<PagedResult<InventoryTransactionDto>> GetTransactionsAsync(string businessId, TransactionQueryDto query)
    {
        var builder = Builders<InventoryTransaction>.Filter;
        var filter = builder.Eq(t => t.BusinessId, businessId);

        if (!string.IsNullOrWhiteSpace(query.ProductId))
            filter &= builder.Eq(t => t.ProductId, query.ProductId);

        var totalCount = await _db.InventoryTransactions.CountDocumentsAsync(filter);
        var transactions = await _db.InventoryTransactions.Find(filter)
            .SortByDescending(t => t.Date)
            .Skip((query.Page - 1) * query.PageSize)
            .Limit(query.PageSize)
            .ToListAsync();

        var productIds = transactions.Select(t => t.ProductId).Distinct().ToList();
        var products = productIds.Count == 0
            ? new List<Product>()
            : await _db.Products.Find(p => productIds.Contains(p.Id)).ToListAsync();
        var nameById = products.ToDictionary(p => p.Id, p => p.Name);

        var mapped = transactions.Select(t => new InventoryTransactionDto
        {
            Id = t.Id,
            ProductId = t.ProductId,
            ProductName = nameById.TryGetValue(t.ProductId, out var name) ? name : "(deleted product)",
            Type = t.Type,
            Quantity = t.Quantity,
            PreviousQuantity = t.PreviousQuantity,
            NewQuantity = t.NewQuantity,
            ReferenceType = t.ReferenceType,
            ReferenceId = t.ReferenceId,
            Date = t.Date
        }).ToList();

        return PagedResult<InventoryTransactionDto>.Create(mapped, totalCount, query.Page, query.PageSize);
    }

    public async Task<InventoryItemDto> AdjustStockAsync(string businessId, AdjustStockDto dto)
    {
        if (dto.QuantityChange == 0)
            throw new ApiException("Quantity change cannot be zero.");

        var product = await ApplyStockChangeAsync(
            businessId,
            dto.ProductId,
            dto.QuantityChange,
            InventoryTransactionType.Adjustment,
            "Manual",
            null);

        _logger.LogInformation(
            "Manual stock adjustment on product {ProductId} by {Delta} for business {BusinessId}. Reason: {Reason}",
            dto.ProductId, dto.QuantityChange, businessId, dto.Reason);

        return ToInventoryItemDto(product);
    }

    public async Task<Product> ApplyStockChangeAsync(
        string businessId,
        string productId,
        int signedQuantity,
        string type,
        string referenceType,
        string? referenceId = null)
    {
        var product = await _db.Products.Find(p => p.Id == productId && p.BusinessId == businessId).FirstOrDefaultAsync();
        if (product is null)
            throw new ApiException("Product not found.", 404);

        var previousQuantity = product.CurrentQuantity;
        var newQuantity = previousQuantity + signedQuantity;

        if (newQuantity < 0)
            throw new ApiException(
                $"Insufficient stock for '{product.Name}'. Available: {previousQuantity}, requested change: {signedQuantity}.", 409);

        var update = Builders<Product>.Update
            .Set(p => p.CurrentQuantity, newQuantity)
            .Set(p => p.UpdatedAt, DateTime.UtcNow);

        await _db.Products.UpdateOneAsync(p => p.Id == productId && p.BusinessId == businessId, update);

        await _db.InventoryTransactions.InsertOneAsync(new InventoryTransaction
        {
            BusinessId = businessId,
            ProductId = productId,
            Type = type,
            Quantity = signedQuantity,
            PreviousQuantity = previousQuantity,
            NewQuantity = newQuantity,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            Date = DateTime.UtcNow
        });

        product.CurrentQuantity = newQuantity;
        return product;
    }

    private static InventoryItemDto ToInventoryItemDto(Product p) => new()
    {
        ProductId = p.Id,
        ProductName = p.Name,
        Sku = p.Sku,
        Category = p.Category,
        Unit = p.Unit,
        CurrentQuantity = p.CurrentQuantity,
        MinimumStockLevel = p.MinimumStockLevel,
        PurchasePrice = p.PurchasePrice,
        SellingPrice = p.SellingPrice,
        StockValue = p.CurrentQuantity * p.PurchasePrice,
        StockStatus = p.CurrentQuantity <= 0 ? "OUT" : p.CurrentQuantity <= p.MinimumStockLevel ? "LOW" : "OK"
    };
}
