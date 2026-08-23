using System.ComponentModel.DataAnnotations;

namespace VyaparAI.Api.DTOs.Sales;

public class CreateSaleItemDto
{
    [Required]
    public string ProductId { get; set; } = string.Empty;

    [Range(1, 100000, ErrorMessage = "Quantity must be at least 1.")]
    public int Quantity { get; set; }

    [Range(0, 10000000, ErrorMessage = "Unit price must be non-negative.")]
    public decimal UnitPrice { get; set; }

    [Range(0, 100, ErrorMessage = "Discount percent must be between 0 and 100.")]
    public decimal DiscountPercent { get; set; }

    [Range(0, 100, ErrorMessage = "GST percent must be between 0 and 100.")]
    public decimal GstPercent { get; set; }
}

public class CreateSaleDto
{
    public string? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerMobile { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "At least one item is required for a sale.")]
    public List<CreateSaleItemDto> Items { get; set; } = new();

    public decimal AdditionalDiscount { get; set; }

    [Required]
    public string PaymentMethod { get; set; } = "Cash"; // Cash, UPI, Card, Credit

    public decimal PaidAmount { get; set; }

    public string? ClientRequestId { get; set; }
}

public class SaleItemResponseDto
{
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal GstPercent { get; set; }
    public decimal TotalAmount { get; set; }
}

public class SaleResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string BusinessId { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;
    public string? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public List<SaleItemResponseDto> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal GstTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal PendingAmount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string PaymentStatus { get; set; } = "Paid";
    public DateTime CreatedAt { get; set; }
}

public class InvoiceDto
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public string? BusinessAddress { get; set; }
    public string? BusinessGstNumber { get; set; }
    public string? BusinessMobile { get; set; }
    public string? BusinessEmail { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerMobile { get; set; }
    public string? CustomerAddress { get; set; }
    public List<SaleItemResponseDto> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal GstTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string PaymentStatus { get; set; } = "Paid";
    public string Currency { get; set; } = "INR";
}
