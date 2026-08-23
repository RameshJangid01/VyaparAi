using MongoDB.Driver;
using VyaparAI.Api.Data;
using VyaparAI.Api.DTOs.Customers;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;
using VyaparAI.Api.Models;

namespace VyaparAI.Api.Services;

public class CustomerService : ICustomerService
{
    private readonly MongoDbContext _db;
    private readonly ILogger<CustomerService> _logger;

    public CustomerService(MongoDbContext db, ILogger<CustomerService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PagedResult<CustomerResponseDto>> GetCustomersAsync(string businessId, CustomerQueryDto query)
    {
        var builder = Builders<Customer>.Filter;
        var filter = builder.Eq(c => c.BusinessId, businessId);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = new MongoDB.Bson.BsonRegularExpression(query.Search.Trim(), "i");
            filter &= builder.Or(builder.Regex(c => c.Name, pattern), builder.Regex(c => c.Mobile, pattern));
        }

        var totalCount = await _db.Customers.CountDocumentsAsync(filter);
        var items = await _db.Customers.Find(filter)
            .SortByDescending(c => c.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Limit(query.PageSize)
            .ToListAsync();

        return PagedResult<CustomerResponseDto>.Create(items.Select(ToDto).ToList(), totalCount, query.Page, query.PageSize);
    }

    public async Task<CustomerResponseDto> GetByIdAsync(string businessId, string customerId)
    {
        var customer = await FindOwnedAsync(businessId, customerId);
        return ToDto(customer);
    }

    public async Task<CustomerResponseDto> CreateAsync(string businessId, CreateCustomerDto dto)
    {
        await EnsureMobileIsUniqueAsync(businessId, dto.Mobile, excludeCustomerId: null);

        var customer = new Customer
        {
            BusinessId = businessId,
            Name = dto.Name.Trim(),
            Mobile = dto.Mobile.Trim(),
            Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim(),
            Address = string.IsNullOrWhiteSpace(dto.Address) ? null : dto.Address.Trim(),
            TotalPurchases = 0,
            TotalPaid = 0,
            PendingAmount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _db.Customers.InsertOneAsync(customer);
        _logger.LogInformation("Customer created: {CustomerId} for business {BusinessId}", customer.Id, businessId);
        return ToDto(customer);
    }

    public async Task<CustomerResponseDto> UpdateAsync(string businessId, string customerId, UpdateCustomerDto dto)
    {
        var customer = await FindOwnedAsync(businessId, customerId);

        if (!string.Equals(customer.Mobile, dto.Mobile.Trim(), StringComparison.Ordinal))
            await EnsureMobileIsUniqueAsync(businessId, dto.Mobile, excludeCustomerId: customerId);

        customer.Name = dto.Name.Trim();
        customer.Mobile = dto.Mobile.Trim();
        customer.Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim();
        customer.Address = string.IsNullOrWhiteSpace(dto.Address) ? null : dto.Address.Trim();
        customer.UpdatedAt = DateTime.UtcNow;

        await _db.Customers.ReplaceOneAsync(c => c.Id == customerId && c.BusinessId == businessId, customer);
        return ToDto(customer);
    }

    public async Task DeleteAsync(string businessId, string customerId)
    {
        await FindOwnedAsync(businessId, customerId);
        var result = await _db.Customers.DeleteOneAsync(c => c.Id == customerId && c.BusinessId == businessId);
        if (result.DeletedCount == 0)
            throw new ApiException("Customer not found.", 404);
    }

    private async Task<Customer> FindOwnedAsync(string businessId, string customerId)
    {
        var customer = await _db.Customers.Find(c => c.Id == customerId && c.BusinessId == businessId).FirstOrDefaultAsync();
        if (customer is null)
            throw new ApiException("Customer not found.", 404);
        return customer;
    }

    private async Task EnsureMobileIsUniqueAsync(string businessId, string mobile, string? excludeCustomerId)
    {
        var normalized = mobile.Trim();
        var filter = Builders<Customer>.Filter.Where(c => c.BusinessId == businessId && c.Mobile == normalized);
        if (excludeCustomerId is not null)
            filter &= Builders<Customer>.Filter.Ne(c => c.Id, excludeCustomerId);

        var exists = await _db.Customers.Find(filter).AnyAsync();
        if (exists)
            throw new ApiException($"A customer with mobile number '{normalized}' already exists.", 409);
    }

    private static CustomerResponseDto ToDto(Customer c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Mobile = c.Mobile,
        Email = c.Email,
        Address = c.Address,
        TotalPurchases = c.TotalPurchases,
        TotalPaid = c.TotalPaid,
        PendingAmount = c.PendingAmount,
        CreatedAt = c.CreatedAt,
        UpdatedAt = c.UpdatedAt
    };
}
