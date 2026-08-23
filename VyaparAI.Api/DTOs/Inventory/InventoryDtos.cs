using System.ComponentModel.DataAnnotations;
using VyaparAI.Api.DTOs.Common;

namespace VyaparAI.Api.DTOs.Inventory;

public class InventoryItemDto
{
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Unit { get; set; } = "pcs";
    public int CurrentQuantity { get; set; }
    public int MinimumStockLevel { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal StockValue { get; set; } // CurrentQuantity * PurchasePrice
    public string StockStatus { get; set; } = "OK"; // OK, LOW, OUT
}

public class InventoryQueryDto : PagedQueryDto
{
    public string? Category { get; set; }
}

public class InventoryTransactionDto
{
    public string Id { get; set; } = string.Empty;
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int PreviousQuantity { get; set; }
    public int NewQuantity { get; set; }
    public string ReferenceType { get; set; } = string.Empty;
    public string? ReferenceId { get; set; }
    public DateTime Date { get; set; }
}

public class TransactionQueryDto : PagedQueryDto
{
    public string? ProductId { get; set; }
}

public class AdjustStockDto
{
    [Required]
    public string ProductId { get; set; } = string.Empty;

    /// <summary>Signed delta to apply: positive to add stock, negative to remove it.</summary>
    [Required]
    public int QuantityChange { get; set; }

    [Required, MaxLength(200)]
    public string Reason { get; set; } = string.Empty;
}

public class InventorySummaryDto
{
    public int TotalProducts { get; set; }
    public int LowStockCount { get; set; }
    public int OutOfStockCount { get; set; }
    public decimal TotalStockValue { get; set; }
}
