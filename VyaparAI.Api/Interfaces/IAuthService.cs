using VyaparAI.Api.DTOs.Auth;

namespace VyaparAI.Api.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> SignupAsync(SignupRequestDto request);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
}
