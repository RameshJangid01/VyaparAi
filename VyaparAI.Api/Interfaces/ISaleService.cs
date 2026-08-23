using VyaparAI.Api.DTOs.Sales;
using VyaparAI.Api.Helpers;

namespace VyaparAI.Api.Interfaces;

public interface ISaleService
{
    Task<SaleResponseDto> CreateSaleAsync(string businessId, CreateSaleDto request);
    Task<PagedResult<SaleResponseDto>> ListSalesAsync(string businessId, int page = 1, int pageSize = 10, string? search = null, DateTime? fromDate = null, DateTime? toDate = null);
    Task<SaleResponseDto> GetSaleByIdAsync(string businessId, string saleId);
    Task<InvoiceDto> GetInvoiceAsync(string businessId, string saleId);
}
