using VyaparAI.Api.DTOs.Suppliers;
using VyaparAI.Api.Helpers;

namespace VyaparAI.Api.Interfaces;

public interface ISupplierService
{
    Task<PagedResult<SupplierResponseDto>> GetSuppliersAsync(string businessId, SupplierQueryDto query);
    Task<SupplierResponseDto> GetByIdAsync(string businessId, string supplierId);
    Task<SupplierResponseDto> CreateAsync(string businessId, CreateSupplierDto dto);
    Task<SupplierResponseDto> UpdateAsync(string businessId, string supplierId, UpdateSupplierDto dto);
    Task DeleteAsync(string businessId, string supplierId);
}
