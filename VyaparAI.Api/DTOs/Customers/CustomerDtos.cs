using System.ComponentModel.DataAnnotations;
using VyaparAI.Api.DTOs.Common;

namespace VyaparAI.Api.DTOs.Customers;

public class CreateCustomerDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, RegularExpression(@"^[6-9]\d{9}$", ErrorMessage = "Enter a valid 10-digit mobile number.")]
    public string Mobile { get; set; } = string.Empty;

    [EmailAddress, MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(250)]
    public string? Address { get; set; }
}

public class UpdateCustomerDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, RegularExpression(@"^[6-9]\d{9}$", ErrorMessage = "Enter a valid 10-digit mobile number.")]
    public string Mobile { get; set; } = string.Empty;

    [EmailAddress, MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(250)]
    public string? Address { get; set; }
}

public class CustomerResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public decimal TotalPurchases { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal PendingAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CustomerQueryDto : PagedQueryDto
{
}
