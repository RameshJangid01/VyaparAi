using VyaparAI.Api.DTOs.Dashboard;

namespace VyaparAI.Api.Interfaces;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetDashboardSummaryAsync(string businessId);
}
