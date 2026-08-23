using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VyaparAI.Api.DTOs.Inventory;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;

namespace VyaparAI.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/inventory")]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    /// <summary>Current stock overview (searchable/paginated) for every active product.</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<InventoryItemDto>>>> GetOverview([FromQuery] InventoryQueryDto query)
    {
        var result = await _inventoryService.GetInventoryOverviewAsync(User.GetBusinessId(), query);
        return Ok(ApiResponse<PagedResult<InventoryItemDto>>.Ok(result));
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<InventorySummaryDto>>> GetSummary()
    {
        var summary = await _inventoryService.GetSummaryAsync(User.GetBusinessId());
        return Ok(ApiResponse<InventorySummaryDto>.Ok(summary));
    }

    [HttpGet("low-stock")]
    public async Task<ActionResult<ApiResponse<List<InventoryItemDto>>>> GetLowStock()
    {
        var lowStock = await _inventoryService.GetLowStockAsync(User.GetBusinessId());
        return Ok(ApiResponse<List<InventoryItemDto>>.Ok(lowStock));
    }

    [HttpGet("transactions")]
    public async Task<ActionResult<ApiResponse<PagedResult<InventoryTransactionDto>>>> GetTransactions([FromQuery] TransactionQueryDto query)
    {
        var result = await _inventoryService.GetTransactionsAsync(User.GetBusinessId(), query);
        return Ok(ApiResponse<PagedResult<InventoryTransactionDto>>.Ok(result));
    }

    /// <summary>Manual stock correction (e.g. damage, stock-take mismatch). Always ledgered as ADJUSTMENT.</summary>
    [HttpPost("adjust")]
    public async Task<ActionResult<ApiResponse<InventoryItemDto>>> AdjustStock([FromBody] AdjustStockDto dto)
    {
        var result = await _inventoryService.AdjustStockAsync(User.GetBusinessId(), dto);
        return Ok(ApiResponse<InventoryItemDto>.Ok(result, "Stock adjusted successfully."));
    }
}
