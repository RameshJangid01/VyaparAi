using VyaparAI.Api.DTOs.Customers;
using VyaparAI.Api.Helpers;

namespace VyaparAI.Api.Interfaces;

public interface ICustomerService
{
    Task<PagedResult<CustomerResponseDto>> GetCustomersAsync(string businessId, CustomerQueryDto query);
    Task<CustomerResponseDto> GetByIdAsync(string businessId, string customerId);
    Task<CustomerResponseDto> CreateAsync(string businessId, CreateCustomerDto dto);
    Task<CustomerResponseDto> UpdateAsync(string businessId, string customerId, UpdateCustomerDto dto);
    Task DeleteAsync(string businessId, string customerId);
}
