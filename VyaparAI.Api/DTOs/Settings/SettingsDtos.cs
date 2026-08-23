using System.ComponentModel.DataAnnotations;

namespace VyaparAI.Api.DTOs.Settings;

public class BusinessProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? GstNumber { get; set; }
    public string Currency { get; set; } = "INR";
}

public class UpdateBusinessProfileDto
{
    [Required]
    [MaxLength(150)]
    public string BusinessName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string OwnerName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string MobileNumber { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Address { get; set; }

    [MaxLength(20)]
    public string? GstNumber { get; set; }

    public string Currency { get; set; } = "INR";
}

public class UserProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string Role { get; set; } = "Owner";
}

public class UpdateUserProfileDto
{
    [Required]
    [MaxLength(100)]
    public string OwnerName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string MobileNumber { get; set; } = string.Empty;
}

public class ChangePasswordDto
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
    public string NewPassword { get; set; } = string.Empty;
}
