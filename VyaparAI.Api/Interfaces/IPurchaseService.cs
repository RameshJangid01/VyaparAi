using VyaparAI.Api.DTOs.Purchases;
using VyaparAI.Api.Helpers;

namespace VyaparAI.Api.Interfaces;

public interface IPurchaseService
{
    Task<PurchaseResponseDto> CreatePurchaseAsync(string businessId, CreatePurchaseDto request);
    Task<PagedResult<PurchaseResponseDto>> ListPurchasesAsync(string businessId, int page = 1, int pageSize = 10, string? supplierId = null, DateTime? fromDate = null, DateTime? toDate = null);
    Task<PurchaseResponseDto> GetPurchaseByIdAsync(string businessId, string purchaseId);
}
