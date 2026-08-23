using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VyaparAI.Api.DTOs.Dashboard;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;

namespace VyaparAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<DashboardSummaryDto>>> GetDashboard()
    {
        var businessId = User.GetBusinessId();
        var result = await _dashboardService.GetDashboardSummaryAsync(businessId);
        return Ok(ApiResponse<DashboardSummaryDto>.Ok(result));
    }
}
