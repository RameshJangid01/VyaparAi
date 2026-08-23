using MongoDB.Driver;
using VyaparAI.Api.Data;
using VyaparAI.Api.DTOs.Suppliers;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;
using VyaparAI.Api.Models;

namespace VyaparAI.Api.Services;

public class SupplierService : ISupplierService
{
    private readonly MongoDbContext _db;
    private readonly ILogger<SupplierService> _logger;

    public SupplierService(MongoDbContext db, ILogger<SupplierService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PagedResult<SupplierResponseDto>> GetSuppliersAsync(string businessId, SupplierQueryDto query)
    {
        var builder = Builders<Supplier>.Filter;
        var filter = builder.Eq(s => s.BusinessId, businessId);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = new MongoDB.Bson.BsonRegularExpression(query.Search.Trim(), "i");
            filter &= builder.Or(
                builder.Regex(s => s.SupplierName, pattern),
                builder.Regex(s => s.Mobile, pattern));
        }

        var totalCount = await _db.Suppliers.CountDocumentsAsync(filter);
        var items = await _db.Suppliers.Find(filter)
            .SortByDescending(s => s.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Limit(query.PageSize)
            .ToListAsync();

        return PagedResult<SupplierResponseDto>.Create(items.Select(ToDto).ToList(), totalCount, query.Page, query.PageSize);
    }

    public async Task<SupplierResponseDto> GetByIdAsync(string businessId, string supplierId)
    {
        var supplier = await FindOwnedAsync(businessId, supplierId);
        return ToDto(supplier);
    }

    public async Task<SupplierResponseDto> CreateAsync(string businessId, CreateSupplierDto dto)
    {
        var supplier = new Supplier
        {
            BusinessId = businessId,
            SupplierName = dto.SupplierName.Trim(),
            ContactPerson = string.IsNullOrWhiteSpace(dto.ContactPerson) ? null : dto.ContactPerson.Trim(),
            Mobile = dto.Mobile.Trim(),
            Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim(),
            Address = string.IsNullOrWhiteSpace(dto.Address) ? null : dto.Address.Trim(),
            GstNumber = string.IsNullOrWhiteSpace(dto.GstNumber) ? null : dto.GstNumber.Trim().ToUpperInvariant(),
            TotalPurchases = 0,
            Paid = 0,
            Pending = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _db.Suppliers.InsertOneAsync(supplier);
        _logger.LogInformation("Supplier created: {SupplierId} for business {BusinessId}", supplier.Id, businessId);
        return ToDto(supplier);
    }

    public async Task<SupplierResponseDto> UpdateAsync(string businessId, string supplierId, UpdateSupplierDto dto)
    {
        var supplier = await FindOwnedAsync(businessId, supplierId);

        supplier.SupplierName = dto.SupplierName.Trim();
        supplier.ContactPerson = string.IsNullOrWhiteSpace(dto.ContactPerson) ? null : dto.ContactPerson.Trim();
        supplier.Mobile = dto.Mobile.Trim();
        supplier.Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim();
        supplier.Address = string.IsNullOrWhiteSpace(dto.Address) ? null : dto.Address.Trim();
        supplier.GstNumber = string.IsNullOrWhiteSpace(dto.GstNumber) ? null : dto.GstNumber.Trim().ToUpperInvariant();
        supplier.UpdatedAt = DateTime.UtcNow;

        await _db.Suppliers.ReplaceOneAsync(s => s.Id == supplierId && s.BusinessId == businessId, supplier);
        return ToDto(supplier);
    }

    public async Task DeleteAsync(string businessId, string supplierId)
    {
        await FindOwnedAsync(businessId, supplierId);

        var linkedProductCount = await _db.Products.CountDocumentsAsync(
            p => p.BusinessId == businessId && p.SupplierId == supplierId);
        if (linkedProductCount > 0)
            throw new ApiException(
                $"Cannot delete this supplier: {linkedProductCount} product(s) are still linked to it.", 409);

        var result = await _db.Suppliers.DeleteOneAsync(s => s.Id == supplierId && s.BusinessId == businessId);
        if (result.DeletedCount == 0)
            throw new ApiException("Supplier not found.", 404);
    }

    private async Task<Supplier> FindOwnedAsync(string businessId, string supplierId)
    {
        var supplier = await _db.Suppliers.Find(s => s.Id == supplierId && s.BusinessId == businessId).FirstOrDefaultAsync();
        if (supplier is null)
            throw new ApiException("Supplier not found.", 404);
        return supplier;
    }

    private static SupplierResponseDto ToDto(Supplier s) => new()
    {
        Id = s.Id,
        SupplierName = s.SupplierName,
        ContactPerson = s.ContactPerson,
        Mobile = s.Mobile,
        Email = s.Email,
        Address = s.Address,
        GstNumber = s.GstNumber,
        TotalPurchases = s.TotalPurchases,
        Paid = s.Paid,
        Pending = s.Pending,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt
    };
}
