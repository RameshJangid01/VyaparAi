using MongoDB.Driver;
using VyaparAI.Api.Data;
using VyaparAI.Api.DTOs.Settings;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;
using VyaparAI.Api.Models;

namespace VyaparAI.Api.Services;

public class SettingsService : ISettingsService
{
    private readonly MongoDbContext _db;

    public SettingsService(MongoDbContext db)
    {
        _db = db;
    }

    public async Task<BusinessProfileDto> GetBusinessProfileAsync(string businessId)
    {
        var business = await _db.Businesses.Find(b => b.Id == businessId).FirstOrDefaultAsync();
        if (business == null)
            throw new ApiException("Business record not found.", 404);

        return new BusinessProfileDto
        {
            Id = business.Id,
            BusinessName = business.BusinessName,
            OwnerName = business.OwnerName,
            Email = business.Email,
            MobileNumber = business.MobileNumber,
            Address = business.Address,
            GstNumber = business.GstNumber,
            Currency = business.Currency
        };
    }

    public async Task<BusinessProfileDto> UpdateBusinessProfileAsync(string businessId, UpdateBusinessProfileDto request)
    {
        var business = await _db.Businesses.Find(b => b.Id == businessId).FirstOrDefaultAsync();
        if (business == null)
            throw new ApiException("Business record not found.", 404);

        business.BusinessName = request.BusinessName.Trim();
        business.OwnerName = request.OwnerName.Trim();
        business.MobileNumber = request.MobileNumber.Trim();
        business.Address = request.Address?.Trim();
        business.GstNumber = request.GstNumber?.Trim();
        business.Currency = string.IsNullOrWhiteSpace(request.Currency) ? "INR" : request.Currency.Trim();
        business.UpdatedAt = DateTime.UtcNow;

        await _db.Businesses.ReplaceOneAsync(b => b.Id == businessId, business);

        return new BusinessProfileDto
        {
            Id = business.Id,
            BusinessName = business.BusinessName,
            OwnerName = business.OwnerName,
            Email = business.Email,
            MobileNumber = business.MobileNumber,
            Address = business.Address,
            GstNumber = business.GstNumber,
            Currency = business.Currency
        };
    }

    public async Task<UserProfileDto> GetUserProfileAsync(string userId)
    {
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        if (user == null)
            throw new ApiException("User not found.", 404);

        return new UserProfileDto
        {
            Id = user.Id,
            OwnerName = user.OwnerName,
            Email = user.Email,
            MobileNumber = user.MobileNumber,
            Role = user.Role ?? "Owner"
        };
    }

    public async Task<UserProfileDto> UpdateUserProfileAsync(string userId, UpdateUserProfileDto request)
    {
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        if (user == null)
            throw new ApiException("User not found.", 404);

        user.OwnerName = request.OwnerName.Trim();
        user.MobileNumber = request.MobileNumber.Trim();
        user.UpdatedAt = DateTime.UtcNow;

        await _db.Users.ReplaceOneAsync(u => u.Id == userId, user);

        return new UserProfileDto
        {
            Id = user.Id,
            OwnerName = user.OwnerName,
            Email = user.Email,
            MobileNumber = user.MobileNumber,
            Role = user.Role ?? "Owner"
        };
    }

    public async Task ChangePasswordAsync(string userId, ChangePasswordDto request)
    {
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        if (user == null)
            throw new ApiException("User not found.", 404);

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new ApiException("Current password is incorrect.", 400);

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _db.Users.ReplaceOneAsync(u => u.Id == userId, user);
    }
}
