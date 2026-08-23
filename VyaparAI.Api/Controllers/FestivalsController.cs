using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VyaparAI.Api.DTOs.Festivals;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;

namespace VyaparAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FestivalsController : ControllerBase
{
    private readonly IFestivalService _festivalService;

    public FestivalsController(IFestivalService festivalService)
    {
        _festivalService = festivalService;
    }

    [HttpGet("upcoming")]
    public async Task<ActionResult<ApiResponse<List<FestivalEventDto>>>> GetUpcomingFestivals([FromQuery] int daysAhead = 90)
    {
        var result = await _festivalService.GetUpcomingFestivalsAsync(daysAhead);
        return Ok(ApiResponse<List<FestivalEventDto>>.Ok(result));
    }
}
