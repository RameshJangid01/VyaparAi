using MongoDB.Driver;
using VyaparAI.Api.Data;
using VyaparAI.Api.DTOs.Festivals;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;
using VyaparAI.Api.Models;

namespace VyaparAI.Api.Services;

public class FestivalService : IFestivalService
{
    private readonly MongoDbContext _db;

    public FestivalService(MongoDbContext db)
    {
        _db = db;
    }

    public async Task<List<FestivalEventDto>> GetUpcomingFestivalsAsync(int daysAhead = 90)
    {
        var now = DateTime.UtcNow;
        var limitDate = now.AddDays(daysAhead);

        var festivals = await _db.FestivalEvents
            .Find(f => f.EndDate >= now && f.StartDate <= limitDate)
            .SortBy(f => f.StartDate)
            .ToListAsync();

        return festivals.Select(f => MapToDto(f, now)).ToList();
    }

    public async Task<List<FestivalEventDto>> GetAllFestivalsAsync()
    {
        var now = DateTime.UtcNow;
        var festivals = await _db.FestivalEvents
            .Find(_ => true)
            .SortBy(f => f.StartDate)
            .ToListAsync();

        return festivals.Select(f => MapToDto(f, now)).ToList();
    }

    public async Task<FestivalEventDto> CreateFestivalAsync(CreateFestivalDto request)
    {
        var festival = new FestivalEvent
        {
            Name = request.Name.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Region = request.Region ?? "India",
            RelevantCategories = request.RelevantCategories ?? new(),
            DemandMultiplier = request.DemandMultiplier > 0 ? request.DemandMultiplier : 1.5,
            Description = request.Description
        };

        await _db.FestivalEvents.InsertOneAsync(festival);
        return MapToDto(festival, DateTime.UtcNow);
    }

    public async Task<FestivalEventDto> UpdateFestivalAsync(string id, UpdateFestivalDto request)
    {
        var festival = await _db.FestivalEvents.Find(f => f.Id == id).FirstOrDefaultAsync();
        if (festival == null)
            throw new ApiException("Festival not found.", 404);

        festival.Name = request.Name.Trim();
        festival.StartDate = request.StartDate;
        festival.EndDate = request.EndDate;
        festival.Region = request.Region ?? "India";
        festival.RelevantCategories = request.RelevantCategories ?? new();
        festival.DemandMultiplier = request.DemandMultiplier > 0 ? request.DemandMultiplier : 1.5;
        festival.Description = request.Description;

        await _db.FestivalEvents.ReplaceOneAsync(f => f.Id == id, festival);
        return MapToDto(festival, DateTime.UtcNow);
    }

    public async Task DeleteFestivalAsync(string id)
    {
        var result = await _db.FestivalEvents.DeleteOneAsync(f => f.Id == id);
        if (result.DeletedCount == 0)
            throw new ApiException("Festival not found.", 404);
    }

    private static FestivalEventDto MapToDto(FestivalEvent f, DateTime now)
    {
        var days = (int)Math.Ceiling((f.StartDate - now).TotalDays);
        if (days < 0) days = 0;

        return new FestivalEventDto
        {
            Id = f.Id,
            Name = f.Name,
            StartDate = f.StartDate,
            EndDate = f.EndDate,
            Region = f.Region,
            RelevantCategories = f.RelevantCategories,
            DemandMultiplier = f.DemandMultiplier,
            Description = f.Description,
            DaysRemaining = days,
            IsActive = true
        };
    }
}
