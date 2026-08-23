using System.ComponentModel.DataAnnotations;
using VyaparAI.Api.DTOs.Common;

namespace VyaparAI.Api.DTOs.Suppliers;

public class CreateSupplierDto
{
    [Required, MaxLength(150)]
    public string SupplierName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ContactPerson { get; set; }

    [Required, RegularExpression(@"^[6-9]\d{9}$", ErrorMessage = "Enter a valid 10-digit mobile number.")]
    public string Mobile { get; set; } = string.Empty;

    [EmailAddress, MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(250)]
    public string? Address { get; set; }

    [MaxLength(15)]
    public string? GstNumber { get; set; }
}

public class UpdateSupplierDto
{
    [Required, MaxLength(150)]
    public string SupplierName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ContactPerson { get; set; }

    [Required, RegularExpression(@"^[6-9]\d{9}$", ErrorMessage = "Enter a valid 10-digit mobile number.")]
    public string Mobile { get; set; } = string.Empty;

    [EmailAddress, MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(250)]
    public string? Address { get; set; }

    [MaxLength(15)]
    public string? GstNumber { get; set; }
}

public class SupplierResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string Mobile { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? GstNumber { get; set; }
    public decimal TotalPurchases { get; set; }
    public decimal Paid { get; set; }
    public decimal Pending { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class SupplierQueryDto : PagedQueryDto
{
}
