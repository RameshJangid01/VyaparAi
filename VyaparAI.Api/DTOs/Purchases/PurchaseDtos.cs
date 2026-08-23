using System.ComponentModel.DataAnnotations;

namespace VyaparAI.Api.DTOs.Purchases;

public class CreatePurchaseItemDto
{
    [Required]
    public string ProductId { get; set; } = string.Empty;

    [Range(1, 100000, ErrorMessage = "Quantity must be at least 1.")]
    public int Quantity { get; set; }

    [Range(0, 10000000, ErrorMessage = "Purchase price must be non-negative.")]
    public decimal PurchasePrice { get; set; }

    [Range(0, 100, ErrorMessage = "GST percent must be between 0 and 100.")]
    public decimal GstPercent { get; set; }

    [Range(0, 100, ErrorMessage = "Discount percent must be between 0 and 100.")]
    public decimal DiscountPercent { get; set; }
}

public class CreatePurchaseDto
{
    [Required]
    public string SupplierId { get; set; } = string.Empty;

    public string? InvoiceNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "At least one item is required for a purchase.")]
    public List<CreatePurchaseItemDto> Items { get; set; } = new();

    public decimal PaidAmount { get; set; }
    public string? Notes { get; set; }
}

public class PurchaseItemResponseDto
{
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal GstPercent { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal TotalAmount { get; set; }
}

public class PurchaseResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string BusinessId { get; set; } = string.Empty;
    public string SupplierId { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime PurchaseDate { get; set; }
    public List<PurchaseItemResponseDto> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal GstTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal PendingAmount { get; set; }
    public string PaymentStatus { get; set; } = "Paid";
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
