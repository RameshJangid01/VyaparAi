using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VyaparAI.Api.DTOs.Reports;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;

namespace VyaparAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("sales")]
    public async Task<ActionResult<ApiResponse<SalesReportSummaryDto>>> GetSalesReport(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var businessId = User.GetBusinessId();
        var result = await _reportService.GetSalesReportAsync(businessId, fromDate, toDate);
        return Ok(ApiResponse<SalesReportSummaryDto>.Ok(result));
    }

    [HttpGet("purchases")]
    public async Task<ActionResult<ApiResponse<PurchaseReportSummaryDto>>> GetPurchaseReport(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? supplierId = null)
    {
        var businessId = User.GetBusinessId();
        var result = await _reportService.GetPurchaseReportAsync(businessId, fromDate, toDate, supplierId);
        return Ok(ApiResponse<PurchaseReportSummaryDto>.Ok(result));
    }

    [HttpGet("profit")]
    public async Task<ActionResult<ApiResponse<ProfitReportDto>>> GetProfitReport(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var businessId = User.GetBusinessId();
        var result = await _reportService.GetProfitReportAsync(businessId, fromDate, toDate);
        return Ok(ApiResponse<ProfitReportDto>.Ok(result));
    }

    [HttpGet("inventory")]
    public async Task<ActionResult<ApiResponse<InventoryReportSummaryDto>>> GetInventoryReport()
    {
        var businessId = User.GetBusinessId();
        var result = await _reportService.GetInventoryReportAsync(businessId);
        return Ok(ApiResponse<InventoryReportSummaryDto>.Ok(result));
    }

    [HttpGet("customers")]
    public async Task<ActionResult<ApiResponse<CustomerReportSummaryDto>>> GetCustomerReport()
    {
        var businessId = User.GetBusinessId();
        var result = await _reportService.GetCustomerReportAsync(businessId);
        return Ok(ApiResponse<CustomerReportSummaryDto>.Ok(result));
    }
}
