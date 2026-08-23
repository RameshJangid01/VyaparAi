// using System.ComponentModel.DataAnnotations;

// namespace VyaparAI.Api.DTOs.AI;

// public class AiChatRequestDto
// {
//     [Required]
//     public string Message { get; set; } = string.Empty;
// }

// public class AiChatResponseDto
// {
//     public string Response { get; set; } = string.Empty;
//     public string Language { get; set; } = "en"; // en, hi, hinglish
//     public List<PurchasePlanItemDto>? RecommendedPurchasePlan { get; set; }
//     public decimal? EstimatedPurchaseCost { get; set; }
//     public decimal? RemainingBudget { get; set; }
//     public List<string>? SuggestedFollowUps { get; set; }
// }

// public class AiInsightDto
// {
//     public string Id { get; set; } = string.Empty;
//     public string Title { get; set; } = string.Empty;
//     public string Description { get; set; } = string.Empty;
//     public string Category { get; set; } = "General"; // Sales, Inventory, Demand, Festival
//     public string Severity { get; set; } = "info"; // info, warning, success
//     public string? ActionText { get; set; }
//     public string? ActionLink { get; set; }
//     public DateTime CreatedAt { get; set; }
// }

// public class ProductForecastDto
// {
//     public string ProductId { get; set; } = string.Empty;
//     public string ProductName { get; set; } = string.Empty;
//     public string Category { get; set; } = string.Empty;
//     public int CurrentStock { get; set; }
//     public int AverageDailySales { get; set; }
//     public int ForecastedDemandNext15Days { get; set; }
//     public int ForecastedDemandNext30Days { get; set; }
//     public int RecommendedReorderQuantity { get; set; }
//     public decimal EstimatedCost { get; set; }
//     public double FestivalMultiplier { get; set; }
//     public string Urgency { get; set; } = "Normal"; // High, Medium, Low
// }

// public class ForecastResponseDto
// {
//     public string UpcomingFestival { get; set; } = string.Empty;
//     public int DaysToFestival { get; set; }
//     public List<ProductForecastDto> Forecasts { get; set; } = new();
// }

// public class PurchasePlanRequestDto
// {
//     [Range(100, 100000000, ErrorMessage = "Budget must be at least ₹100.")]
//     public decimal Budget { get; set; }

//     public string? FestivalFocus { get; set; }
//     public int PlanHorizonDays { get; set; } = 30;
// }

// public class PurchasePlanItemDto
// {
//     public string ProductId { get; set; } = string.Empty;
//     public string ProductName { get; set; } = string.Empty;
//     public string Category { get; set; } = string.Empty;
//     public string? SupplierId { get; set; }
//     public string? SupplierName { get; set; }
//     public int CurrentStock { get; set; }
//     public int SuggestedQuantity { get; set; }
//     public decimal UnitPurchasePrice { get; set; }
//     public decimal TotalCost { get; set; }
//     public string Reason { get; set; } = string.Empty;
//     public int ConfidencePercent { get; set; }
// }

// public class PurchasePlanResponseDto
// {
//     public decimal BudgetAllocated { get; set; }
//     public decimal TotalEstimatedCost { get; set; }
//     public decimal BudgetRemaining { get; set; }
//     public int TotalItemsCount { get; set; }
//     public List<PurchasePlanItemDto> Items { get; set; } = new();
//     public string Summary { get; set; } = string.Empty;
// }



using System.ComponentModel.DataAnnotations;

namespace VyaparAI.Api.DTOs.AI;

public class AiChatRequestDto
{
    [Required]
    public string Message { get; set; } = string.Empty;
}

public class AiChatResponseDto
{
    public string Response { get; set; } = string.Empty;
    public string Language { get; set; } = "en"; // en, hi, hinglish
    public List<PurchasePlanItemDto>? RecommendedPurchasePlan { get; set; }
    public decimal? EstimatedPurchaseCost { get; set; }
    public decimal? RemainingBudget { get; set; }
    public List<string>? SuggestedFollowUps { get; set; }
}

public class AiInsightDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "General"; // Sales, Inventory, Demand, Festival
    public string Severity { get; set; } = "info"; // info, warning, success
    public string? ActionText { get; set; }
    public string? ActionLink { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ProductForecastDto
{
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public int AverageDailySales { get; set; }
    public int ForecastedDemandNext15Days { get; set; }
    public int ForecastedDemandNext30Days { get; set; }
    public int RecommendedReorderQuantity { get; set; }
    public decimal EstimatedCost { get; set; }
    public double FestivalMultiplier { get; set; }
    public string Urgency { get; set; } = "Normal"; // High, Medium, Low
}

public class ForecastResponseDto
{
    public string UpcomingFestival { get; set; } = string.Empty;
    public int DaysToFestival { get; set; }
    public List<ProductForecastDto> Forecasts { get; set; } = new();
}

public class PurchasePlanRequestDto
{
    [Range(100, 100000000, ErrorMessage = "Budget must be at least ₹100.")]
    public decimal Budget { get; set; }

    public string? FestivalFocus { get; set; }
    public int PlanHorizonDays { get; set; } = 30;
}

public class PurchasePlanItemDto
{
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public int CurrentStock { get; set; }
    public int SuggestedQuantity { get; set; }
    public decimal UnitPurchasePrice { get; set; }
    public decimal TotalCost { get; set; }
    public string Reason { get; set; } = string.Empty;
    public int ConfidencePercent { get; set; }
    public string? ProductLink { get; set; }
}

public class PurchasePlanResponseDto
{
    public decimal BudgetAllocated { get; set; }
    public decimal TotalEstimatedCost { get; set; }
    public decimal BudgetRemaining { get; set; }
    public int TotalItemsCount { get; set; }
    public List<PurchasePlanItemDto> Items { get; set; } = new();
    public string Summary { get; set; } = string.Empty;
}