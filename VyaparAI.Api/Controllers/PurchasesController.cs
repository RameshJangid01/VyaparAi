using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VyaparAI.Api.DTOs.Purchases;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;

namespace VyaparAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PurchasesController : ControllerBase
{
    private readonly IPurchaseService _purchaseService;

    public PurchasesController(IPurchaseService purchaseService)
    {
        _purchaseService = purchaseService;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<PurchaseResponseDto>>> CreatePurchase([FromBody] CreatePurchaseDto request)
    {
        var businessId = User.GetBusinessId();
        var result = await _purchaseService.CreatePurchaseAsync(businessId, request);
        return CreatedAtAction(nameof(GetPurchaseById), new { id = result.Id }, ApiResponse<PurchaseResponseDto>.Ok(result, "Purchase recorded and stock updated."));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<PurchaseResponseDto>>>> ListPurchases(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? supplierId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var businessId = User.GetBusinessId();
        var result = await _purchaseService.ListPurchasesAsync(businessId, page, pageSize, supplierId, fromDate, toDate);
        return Ok(ApiResponse<PagedResult<PurchaseResponseDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<PurchaseResponseDto>>> GetPurchaseById(string id)
    {
        var businessId = User.GetBusinessId();
        var result = await _purchaseService.GetPurchaseByIdAsync(businessId, id);
        return Ok(ApiResponse<PurchaseResponseDto>.Ok(result));
    }
}
