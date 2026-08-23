using VyaparAI.Api.DTOs.Settings;

namespace VyaparAI.Api.Interfaces;

public interface ISettingsService
{
    Task<BusinessProfileDto> GetBusinessProfileAsync(string businessId);
    Task<BusinessProfileDto> UpdateBusinessProfileAsync(string businessId, UpdateBusinessProfileDto request);
    Task<UserProfileDto> GetUserProfileAsync(string userId);
    Task<UserProfileDto> UpdateUserProfileAsync(string userId, UpdateUserProfileDto request);
    Task ChangePasswordAsync(string userId, ChangePasswordDto request);
}
