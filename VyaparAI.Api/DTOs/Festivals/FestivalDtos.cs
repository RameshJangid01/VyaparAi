using System.ComponentModel.DataAnnotations;

namespace VyaparAI.Api.DTOs.Festivals;

public class FestivalEventDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Region { get; set; } = "India";
    public List<string> RelevantCategories { get; set; } = new();
    public double DemandMultiplier { get; set; } = 1.0;
    public string? Description { get; set; }
    public int DaysRemaining { get; set; }
    public bool IsActive { get; set; } = true;
}

public class CreateFestivalDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public string Region { get; set; } = "India";

    public List<string> RelevantCategories { get; set; } = new();

    [Range(0.5, 10.0, ErrorMessage = "Demand multiplier must be between 0.5 and 10.0")]
    public double DemandMultiplier { get; set; } = 1.5;

    public string? Description { get; set; }
}

public class UpdateFestivalDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public string Region { get; set; } = "India";

    public List<string> RelevantCategories { get; set; } = new();

    [Range(0.5, 10.0, ErrorMessage = "Demand multiplier must be between 0.5 and 10.0")]
    public double DemandMultiplier { get; set; } = 1.5;

    public string? Description { get; set; }
}
