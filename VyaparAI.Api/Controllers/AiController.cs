using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VyaparAI.Api.DTOs.AI;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;

namespace VyaparAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly IAiService _aiService;

    public AiController(IAiService aiService)
    {
        _aiService = aiService;
    }

    [HttpPost("ask")]
    public async Task<ActionResult<ApiResponse<AiChatResponseDto>>> AskCopilot([FromBody] AiChatRequestDto request)
    {
        var businessId = User.GetBusinessId();
        var result = await _aiService.AskCopilotAsync(businessId, request.Message);
        return Ok(ApiResponse<AiChatResponseDto>.Ok(result));
    }

    [HttpGet("insights")]
    public async Task<ActionResult<ApiResponse<List<AiInsightDto>>>> GetInsights()
    {
        var businessId = User.GetBusinessId();
        var result = await _aiService.GetInsightsAsync(businessId);
        return Ok(ApiResponse<List<AiInsightDto>>.Ok(result));
    }

    [HttpGet("forecast")]
    public async Task<ActionResult<ApiResponse<ForecastResponseDto>>> GetForecast()
    {
        var businessId = User.GetBusinessId();
        var result = await _aiService.GetDemandForecastAsync(businessId);
        return Ok(ApiResponse<ForecastResponseDto>.Ok(result));
    }

    [HttpPost("purchase-plan")]
    public async Task<ActionResult<ApiResponse<PurchasePlanResponseDto>>> GeneratePurchasePlan([FromBody] PurchasePlanRequestDto request)
    {
        var businessId = User.GetBusinessId();
        var result = await _aiService.GeneratePurchasePlanAsync(businessId, request);
        return Ok(ApiResponse<PurchasePlanResponseDto>.Ok(result, "Optimized purchase plan generated successfully."));
    }
}
