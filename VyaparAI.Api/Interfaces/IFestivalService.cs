using VyaparAI.Api.DTOs.Festivals;

namespace VyaparAI.Api.Interfaces;

public interface IFestivalService
{
    Task<List<FestivalEventDto>> GetUpcomingFestivalsAsync(int daysAhead = 90);
    Task<List<FestivalEventDto>> GetAllFestivalsAsync();
    Task<FestivalEventDto> CreateFestivalAsync(CreateFestivalDto request);
    Task<FestivalEventDto> UpdateFestivalAsync(string id, UpdateFestivalDto request);
    Task DeleteFestivalAsync(string id);
}
