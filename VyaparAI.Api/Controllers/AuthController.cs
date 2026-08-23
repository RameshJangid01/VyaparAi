using Microsoft.AspNetCore.Mvc;
using VyaparAI.Api.DTOs.Auth;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;

namespace VyaparAI.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>Creates a new Business + owner User account and returns a JWT.</summary>
    [HttpPost("signup")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Signup([FromBody] SignupRequestDto request)
    {
        var result = await _authService.SignupAsync(request);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Account created successfully."));
    }

    /// <summary>Authenticates an existing user and returns a JWT.</summary>
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Login successful."));
    }
}
