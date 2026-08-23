using MongoDB.Driver;
using VyaparAI.Api.Data;
using VyaparAI.Api.DTOs.Products;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;
using VyaparAI.Api.Models;

namespace VyaparAI.Api.Services;

public class ProductService : IProductService
{
    private readonly MongoDbContext _db;
    private readonly ILogger<ProductService> _logger;

    public ProductService(MongoDbContext db, ILogger<ProductService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PagedResult<ProductResponseDto>> GetProductsAsync(string businessId, ProductQueryDto query)
    {
        var builder = Builders<Product>.Filter;
        var filter = builder.Eq(p => p.BusinessId, businessId);

        if (query.IncludeInactive != true)
            filter &= builder.Eq(p => p.IsActive, true);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = new MongoDB.Bson.BsonRegularExpression(query.Search.Trim(), "i");
            filter &= builder.Or(
                builder.Regex(p => p.Name, pattern),
                builder.Regex(p => p.Sku, pattern),
                builder.Regex(p => p.Barcode, pattern));
        }

        if (!string.IsNullOrWhiteSpace(query.Category))
            filter &= builder.Eq(p => p.Category, query.Category);

        if (query.LowStockOnly == true)
        {
            // Field-to-field comparison isn't expressible with the typed filter builder,
            // so this is applied client-side after fetching the business's active products.
            var all = await _db.Products.Find(filter).SortByDescending(p => p.CreatedAt).ToListAsync();
            var lowStock = all.Where(p => p.CurrentQuantity <= p.MinimumStockLevel).ToList();
            var pagedLow = lowStock.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToList();
            var mappedLow = await MapToResponseAsync(pagedLow);
            return PagedResult<ProductResponseDto>.Create(mappedLow, lowStock.Count, query.Page, query.PageSize);
        }

        var totalCount = await _db.Products.CountDocumentsAsync(filter);
        var items = await _db.Products.Find(filter)
            .SortByDescending(p => p.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Limit(query.PageSize)
            .ToListAsync();

        var mapped = await MapToResponseAsync(items);
        return PagedResult<ProductResponseDto>.Create(mapped, totalCount, query.Page, query.PageSize);
    }

    public async Task<ProductResponseDto> GetByIdAsync(string businessId, string productId)
    {
        var product = await FindOwnedAsync(businessId, productId);
        var mapped = await MapToResponseAsync(new List<Product> { product });
        return mapped[0];
    }

    public async Task<ProductResponseDto> CreateAsync(string businessId, CreateProductDto dto)
    {
        await EnsureSkuIsUniqueAsync(businessId, dto.Sku, excludeProductId: null);

        var product = new Product
        {
            BusinessId = businessId,
            Name = dto.Name.Trim(),
            Sku = dto.Sku.Trim(),
            Barcode = string.IsNullOrWhiteSpace(dto.Barcode) ? null : dto.Barcode.Trim(),
            Category = dto.Category.Trim(),
            Brand = string.IsNullOrWhiteSpace(dto.Brand) ? null : dto.Brand.Trim(),
            PurchasePrice = dto.PurchasePrice,
            SellingPrice = dto.SellingPrice,
            GstPercentage = dto.GstPercentage,
            CurrentQuantity = dto.CurrentQuantity,
            MinimumStockLevel = dto.MinimumStockLevel,
            SupplierId = string.IsNullOrWhiteSpace(dto.SupplierId) ? null : dto.SupplierId,
            ExpiryDate = dto.ExpiryDate,
            Unit = string.IsNullOrWhiteSpace(dto.Unit) ? "pcs" : dto.Unit.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _db.Products.InsertOneAsync(product);

        // Record the opening quantity in the ledger so InventoryTransactions can always
        // explain how the current stock came to be, without re-applying it to the product
        // (the quantity above was already set at insert time).
        if (product.CurrentQuantity > 0)
        {
            await _db.InventoryTransactions.InsertOneAsync(new InventoryTransaction
            {
                BusinessId = businessId,
                ProductId = product.Id,
                Type = InventoryTransactionType.Adjustment,
                Quantity = product.CurrentQuantity,
                PreviousQuantity = 0,
                NewQuantity = product.CurrentQuantity,
                ReferenceType = "OpeningStock",
                ReferenceId = null,
                Date = DateTime.UtcNow
            });
        }

        _logger.LogInformation("Product created: {ProductId} for business {BusinessId}", product.Id, businessId);

        var mapped = await MapToResponseAsync(new List<Product> { product });
        return mapped[0];
    }

    public async Task<ProductResponseDto> UpdateAsync(string businessId, string productId, UpdateProductDto dto)
    {
        var product = await FindOwnedAsync(businessId, productId);

        if (!string.Equals(product.Sku, dto.Sku.Trim(), StringComparison.OrdinalIgnoreCase))
            await EnsureSkuIsUniqueAsync(businessId, dto.Sku, excludeProductId: productId);

        product.Name = dto.Name.Trim();
        product.Sku = dto.Sku.Trim();
        product.Barcode = string.IsNullOrWhiteSpace(dto.Barcode) ? null : dto.Barcode.Trim();
        product.Category = dto.Category.Trim();
        product.Brand = string.IsNullOrWhiteSpace(dto.Brand) ? null : dto.Brand.Trim();
        product.PurchasePrice = dto.PurchasePrice;
        product.SellingPrice = dto.SellingPrice;
        product.GstPercentage = dto.GstPercentage;
        product.MinimumStockLevel = dto.MinimumStockLevel;
        product.SupplierId = string.IsNullOrWhiteSpace(dto.SupplierId) ? null : dto.SupplierId;
        product.ExpiryDate = dto.ExpiryDate;
        product.Unit = string.IsNullOrWhiteSpace(dto.Unit) ? "pcs" : dto.Unit.Trim();
        product.IsActive = dto.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.Products.ReplaceOneAsync(p => p.Id == productId && p.BusinessId == businessId, product);

        var mapped = await MapToResponseAsync(new List<Product> { product });
        return mapped[0];
    }

    public async Task DeleteAsync(string businessId, string productId)
    {
        await FindOwnedAsync(businessId, productId);
        var result = await _db.Products.DeleteOneAsync(p => p.Id == productId && p.BusinessId == businessId);
        if (result.DeletedCount == 0)
            throw new ApiException("Product not found.", 404);
    }

    public async Task<List<string>> GetCategoriesAsync(string businessId)
    {
        var categories = await _db.Products
            .Find(p => p.BusinessId == businessId && p.IsActive)
            .Project(p => p.Category)
            .ToListAsync();

        return categories
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(c => c)
            .ToList();
    }

    private async Task<Product> FindOwnedAsync(string businessId, string productId)
    {
        var product = await _db.Products.Find(p => p.Id == productId && p.BusinessId == businessId).FirstOrDefaultAsync();
        if (product is null)
            throw new ApiException("Product not found.", 404);
        return product;
    }

    private async Task EnsureSkuIsUniqueAsync(string businessId, string sku, string? excludeProductId)
    {
        var normalized = sku.Trim();
        var exactPattern = new MongoDB.Bson.BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(normalized)}$", "i");
        var filter = Builders<Product>.Filter.Eq(p => p.BusinessId, businessId)
                     & Builders<Product>.Filter.Regex(p => p.Sku, exactPattern);

        if (excludeProductId is not null)
            filter &= Builders<Product>.Filter.Ne(p => p.Id, excludeProductId);

        var exists = await _db.Products.Find(filter).AnyAsync();
        if (exists)
            throw new ApiException($"A product with SKU '{normalized}' already exists.", 409);
    }

    private async Task<List<ProductResponseDto>> MapToResponseAsync(List<Product> products)
    {
        var supplierIds = products.Where(p => p.SupplierId is not null).Select(p => p.SupplierId!).Distinct().ToList();
        var suppliers = supplierIds.Count == 0
            ? new List<Supplier>()
            : await _db.Suppliers.Find(s => supplierIds.Contains(s.Id)).ToListAsync();
        var supplierNameById = suppliers.ToDictionary(s => s.Id, s => s.SupplierName);

        return products.Select(p => new ProductResponseDto
        {
            Id = p.Id,
            Name = p.Name,
            Sku = p.Sku,
            Barcode = p.Barcode,
            Category = p.Category,
            Brand = p.Brand,
            PurchasePrice = p.PurchasePrice,
            SellingPrice = p.SellingPrice,
            GstPercentage = p.GstPercentage,
            CurrentQuantity = p.CurrentQuantity,
            MinimumStockLevel = p.MinimumStockLevel,
            SupplierId = p.SupplierId,
            SupplierName = p.SupplierId is not null && supplierNameById.TryGetValue(p.SupplierId, out var name) ? name : null,
            ExpiryDate = p.ExpiryDate,
            Unit = p.Unit,
            IsActive = p.IsActive,
            StockStatus = p.CurrentQuantity <= 0 ? "OUT" : p.CurrentQuantity <= p.MinimumStockLevel ? "LOW" : "OK",
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        }).ToList();
    }
}
