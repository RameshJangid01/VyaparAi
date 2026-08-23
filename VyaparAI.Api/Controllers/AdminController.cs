using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VyaparAI.Api.DTOs.Admin;
using VyaparAI.Api.DTOs.Festivals;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;

namespace VyaparAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IFestivalService _festivalService;

    public AdminController(IAdminService adminService, IFestivalService festivalService)
    {
        _adminService = adminService;
        _festivalService = festivalService;
    }

    private void EnsureAdmin()
    {
        if (!User.IsAdmin())
            throw new ApiException("Access denied. Admin privileges required.", 403);
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<AdminDashboardDto>>> GetDashboard()
    {
        EnsureAdmin();
        var result = await _adminService.GetPlatformDashboardAsync();
        return Ok(ApiResponse<AdminDashboardDto>.Ok(result));
    }

    [HttpGet("businesses")]
    public async Task<ActionResult<ApiResponse<List<AdminBusinessDto>>>> GetBusinesses()
    {
        EnsureAdmin();
        var result = await _adminService.GetBusinessesAsync();
        return Ok(ApiResponse<List<AdminBusinessDto>>.Ok(result));
    }

    [HttpPost("businesses/{id}/status")]
    public async Task<ActionResult<ApiResponse<string>>> ToggleBusinessStatus(string id, [FromBody] bool isActive)
    {
        EnsureAdmin();
        await _adminService.ToggleBusinessStatusAsync(id, isActive);
        return Ok(ApiResponse<string>.Ok(isActive ? "Business activated." : "Business deactivated."));
    }

    [HttpGet("users")]
    public async Task<ActionResult<ApiResponse<List<AdminUserDto>>>> GetUsers()
    {
        EnsureAdmin();
        var result = await _adminService.GetUsersAsync();
        return Ok(ApiResponse<List<AdminUserDto>>.Ok(result));
    }

    [HttpPost("users/{id}/status")]
    public async Task<ActionResult<ApiResponse<string>>> ToggleUserStatus(string id, [FromBody] bool isActive)
    {
        EnsureAdmin();
        await _adminService.ToggleUserStatusAsync(id, isActive);
        return Ok(ApiResponse<string>.Ok(isActive ? "User activated." : "User deactivated."));
    }

    public class UpdateRoleRequest
    {
        public string Role { get; set; } = "Owner";
    }

    [HttpPost("users/{id}/role")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateUserRole(string id, [FromBody] UpdateRoleRequest request)
    {
        EnsureAdmin();
        await _adminService.UpdateUserRoleAsync(id, request.Role);
        return Ok(ApiResponse<string>.Ok($"User role updated to {request.Role}."));
    }

    [HttpGet("products")]
    public async Task<ActionResult<ApiResponse<AdminProductsOverviewDto>>> GetProductsOverview()
    {
        EnsureAdmin();
        var result = await _adminService.GetSystemProductsOverviewAsync();
        return Ok(ApiResponse<AdminProductsOverviewDto>.Ok(result));
    }

    [HttpGet("sales")]
    public async Task<ActionResult<ApiResponse<AdminSalesOverviewDto>>> GetSalesOverview()
    {
        EnsureAdmin();
        var result = await _adminService.GetSystemSalesOverviewAsync();
        return Ok(ApiResponse<AdminSalesOverviewDto>.Ok(result));
    }

    [HttpGet("festivals")]
    public async Task<ActionResult<ApiResponse<List<FestivalEventDto>>>> GetFestivals()
    {
        EnsureAdmin();
        var result = await _festivalService.GetAllFestivalsAsync();
        return Ok(ApiResponse<List<FestivalEventDto>>.Ok(result));
    }

    [HttpPost("festivals")]
    public async Task<ActionResult<ApiResponse<FestivalEventDto>>> CreateFestival([FromBody] CreateFestivalDto request)
    {
        EnsureAdmin();
        var result = await _festivalService.CreateFestivalAsync(request);
        return Ok(ApiResponse<FestivalEventDto>.Ok(result, "Festival event created."));
    }

    [HttpPut("festivals/{id}")]
    public async Task<ActionResult<ApiResponse<FestivalEventDto>>> UpdateFestival(string id, [FromBody] UpdateFestivalDto request)
    {
        EnsureAdmin();
        var result = await _festivalService.UpdateFestivalAsync(id, request);
        return Ok(ApiResponse<FestivalEventDto>.Ok(result, "Festival event updated."));
    }

    [HttpDelete("festivals/{id}")]
    public async Task<ActionResult<ApiResponse<string>>> DeleteFestival(string id)
    {
        EnsureAdmin();
        await _festivalService.DeleteFestivalAsync(id);
        return Ok(ApiResponse<string>.Ok("Festival deleted successfully."));
    }

    [HttpGet("settings")]
    public async Task<ActionResult<ApiResponse<SystemSettingsDto>>> GetSettings()
    {
        EnsureAdmin();
        var result = await _adminService.GetSystemSettingsAsync();
        return Ok(ApiResponse<SystemSettingsDto>.Ok(result));
    }
}
