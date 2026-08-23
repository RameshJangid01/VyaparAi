using VyaparAI.Api.DTOs.AI;

namespace VyaparAI.Api.Interfaces;

public interface IAiService
{
    Task<AiChatResponseDto> AskCopilotAsync(string businessId, string message);
    Task<List<AiInsightDto>> GetInsightsAsync(string businessId);
    Task<ForecastResponseDto> GetDemandForecastAsync(string businessId);
    Task<PurchasePlanResponseDto> GeneratePurchasePlanAsync(string businessId, PurchasePlanRequestDto request);
}
