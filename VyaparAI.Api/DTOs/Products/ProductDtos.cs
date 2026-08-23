using System.ComponentModel.DataAnnotations;
using VyaparAI.Api.DTOs.Common;

namespace VyaparAI.Api.DTOs.Products;

public class CreateProductDto
{
    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Sku { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Barcode { get; set; }

    [Required, MaxLength(80)]
    public string Category { get; set; } = string.Empty;

    [MaxLength(80)]
    public string? Brand { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Purchase price cannot be negative.")]
    public decimal PurchasePrice { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Selling price cannot be negative.")]
    public decimal SellingPrice { get; set; }

    [Range(0, 100, ErrorMessage = "GST percentage must be between 0 and 100.")]
    public decimal GstPercentage { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Opening quantity cannot be negative.")]
    public int CurrentQuantity { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Minimum stock level cannot be negative.")]
    public int MinimumStockLevel { get; set; }

    public string? SupplierId { get; set; }

    public DateTime? ExpiryDate { get; set; }

    [Required]
    public string Unit { get; set; } = "pcs";
}

public class UpdateProductDto
{
    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Sku { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Barcode { get; set; }

    [Required, MaxLength(80)]
    public string Category { get; set; } = string.Empty;

    [MaxLength(80)]
    public string? Brand { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Purchase price cannot be negative.")]
    public decimal PurchasePrice { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Selling price cannot be negative.")]
    public decimal SellingPrice { get; set; }

    [Range(0, 100, ErrorMessage = "GST percentage must be between 0 and 100.")]
    public decimal GstPercentage { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Minimum stock level cannot be negative.")]
    public int MinimumStockLevel { get; set; }

    public string? SupplierId { get; set; }

    public DateTime? ExpiryDate { get; set; }

    [Required]
    public string Unit { get; set; } = "pcs";

    public bool IsActive { get; set; } = true;

    // NOTE: CurrentQuantity is intentionally absent here. Stock can only change
    // through a recorded InventoryTransaction (Purchase, Sale, Adjustment, Return)
    // so the ledger always explains the current quantity. Use POST /api/inventory/adjust.
}

public class ProductResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal GstPercentage { get; set; }
    public int CurrentQuantity { get; set; }
    public int MinimumStockLevel { get; set; }
    public string? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string Unit { get; set; } = "pcs";
    public bool IsActive { get; set; }
    public string StockStatus { get; set; } = "OK"; // OK, LOW, OUT
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ProductQueryDto : PagedQueryDto
{
    public string? Category { get; set; }
    public bool? LowStockOnly { get; set; }
    public bool? IncludeInactive { get; set; }
}
