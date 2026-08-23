using VyaparAI.Api.DTOs.Admin;

namespace VyaparAI.Api.Interfaces;

public interface IAdminService
{
    Task<AdminDashboardDto> GetPlatformDashboardAsync();
    Task<List<AdminBusinessDto>> GetBusinessesAsync();
    Task ToggleBusinessStatusAsync(string businessId, bool isActive);
    Task<List<AdminUserDto>> GetUsersAsync();
    Task ToggleUserStatusAsync(string userId, bool isActive);
    Task UpdateUserRoleAsync(string userId, string role);
    Task<AdminProductsOverviewDto> GetSystemProductsOverviewAsync();
    Task<AdminSalesOverviewDto> GetSystemSalesOverviewAsync();
    Task<SystemSettingsDto> GetSystemSettingsAsync();
}
