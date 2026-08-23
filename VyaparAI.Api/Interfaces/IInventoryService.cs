using VyaparAI.Api.DTOs.Inventory;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Models;

namespace VyaparAI.Api.Interfaces;

public interface IInventoryService
{
    Task<PagedResult<InventoryItemDto>> GetInventoryOverviewAsync(string businessId, InventoryQueryDto query);
    Task<List<InventoryItemDto>> GetLowStockAsync(string businessId);
    Task<InventorySummaryDto> GetSummaryAsync(string businessId);
    Task<PagedResult<InventoryTransactionDto>> GetTransactionsAsync(string businessId, TransactionQueryDto query);
    Task<InventoryItemDto> AdjustStockAsync(string businessId, AdjustStockDto dto);

    /// <summary>
    /// Applies a signed stock change to a product and writes the matching ledger
    /// entry. This is the single choke point every stock-changing feature must go
    /// through (manual adjustment here in Phase 2, and Purchases/Sales in Phase 3)
    /// so InventoryTransactions always explain the product's current quantity.
    /// Throws ApiException if the change would drive stock below zero.
    /// </summary>
    Task<Product> ApplyStockChangeAsync(
        string businessId,
        string productId,
        int signedQuantity,
        string type,
        string referenceType,
        string? referenceId = null);
}
