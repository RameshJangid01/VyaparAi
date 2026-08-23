using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VyaparAI.Api.DTOs.Settings;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;

namespace VyaparAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;

    public SettingsController(ISettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    [HttpGet("business")]
    public async Task<ActionResult<ApiResponse<BusinessProfileDto>>> GetBusinessProfile()
    {
        var businessId = User.GetBusinessId();
        var result = await _settingsService.GetBusinessProfileAsync(businessId);
        return Ok(ApiResponse<BusinessProfileDto>.Ok(result));
    }

    [HttpPut("business")]
    public async Task<ActionResult<ApiResponse<BusinessProfileDto>>> UpdateBusinessProfile([FromBody] UpdateBusinessProfileDto request)
    {
        var businessId = User.GetBusinessId();
        var result = await _settingsService.UpdateBusinessProfileAsync(businessId, request);
        return Ok(ApiResponse<BusinessProfileDto>.Ok(result, "Business profile updated successfully."));
    }

    [HttpGet("profile")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetUserProfile()
    {
        var userId = User.GetUserId();
        var result = await _settingsService.GetUserProfileAsync(userId);
        return Ok(ApiResponse<UserProfileDto>.Ok(result));
    }

    [HttpPut("profile")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> UpdateUserProfile([FromBody] UpdateUserProfileDto request)
    {
        var userId = User.GetUserId();
        var result = await _settingsService.UpdateUserProfileAsync(userId, request);
        return Ok(ApiResponse<UserProfileDto>.Ok(result, "User profile updated successfully."));
    }

    [HttpPost("change-password")]
    public async Task<ActionResult<ApiResponse<string>>> ChangePassword([FromBody] ChangePasswordDto request)
    {
        var userId = User.GetUserId();
        await _settingsService.ChangePasswordAsync(userId, request);
        return Ok(ApiResponse<string>.Ok("Password changed successfully.", "Password updated."));
    }
}
