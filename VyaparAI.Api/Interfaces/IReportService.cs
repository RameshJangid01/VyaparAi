using VyaparAI.Api.DTOs.Reports;

namespace VyaparAI.Api.Interfaces;

public interface IReportService
{
    Task<SalesReportSummaryDto> GetSalesReportAsync(string businessId, DateTime? fromDate = null, DateTime? toDate = null);
    Task<PurchaseReportSummaryDto> GetPurchaseReportAsync(string businessId, DateTime? fromDate = null, DateTime? toDate = null, string? supplierId = null);
    Task<ProfitReportDto> GetProfitReportAsync(string businessId, DateTime? fromDate = null, DateTime? toDate = null);
    Task<InventoryReportSummaryDto> GetInventoryReportAsync(string businessId);
    Task<CustomerReportSummaryDto> GetCustomerReportAsync(string businessId);
}
