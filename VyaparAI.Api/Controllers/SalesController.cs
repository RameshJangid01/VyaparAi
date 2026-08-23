using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VyaparAI.Api.DTOs.Sales;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;

namespace VyaparAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SalesController : ControllerBase
{
    private readonly ISaleService _saleService;

    public SalesController(ISaleService saleService)
    {
        _saleService = saleService;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SaleResponseDto>>> CreateSale([FromBody] CreateSaleDto request)
    {
        var businessId = User.GetBusinessId();
        var result = await _saleService.CreateSaleAsync(businessId, request);
        return CreatedAtAction(nameof(GetSaleById), new { id = result.Id }, ApiResponse<SaleResponseDto>.Ok(result, "Sale completed successfully."));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<SaleResponseDto>>>> ListSales(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var businessId = User.GetBusinessId();
        var result = await _saleService.ListSalesAsync(businessId, page, pageSize, search, fromDate, toDate);
        return Ok(ApiResponse<PagedResult<SaleResponseDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<SaleResponseDto>>> GetSaleById(string id)
    {
        var businessId = User.GetBusinessId();
        var result = await _saleService.GetSaleByIdAsync(businessId, id);
        return Ok(ApiResponse<SaleResponseDto>.Ok(result));
    }

    [HttpGet("{id}/invoice")]
    public async Task<ActionResult<ApiResponse<InvoiceDto>>> GetInvoice(string id)
    {
        var businessId = User.GetBusinessId();
        var result = await _saleService.GetInvoiceAsync(businessId, id);
        return Ok(ApiResponse<InvoiceDto>.Ok(result));
    }
}
