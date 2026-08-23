using MongoDB.Driver;
using VyaparAI.Api.Data;
using VyaparAI.Api.DTOs.Auth;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;
using VyaparAI.Api.Models;

namespace VyaparAI.Api.Services;

public class AuthService : IAuthService
{
    private readonly MongoDbContext _db;
    private readonly JwtHelper _jwtHelper;
    private readonly ILogger<AuthService> _logger;

    public AuthService(MongoDbContext db, JwtHelper jwtHelper, ILogger<AuthService> logger)
    {
        _db = db;
        _jwtHelper = jwtHelper;
        _logger = logger;
    }

    public async Task<AuthResponseDto> SignupAsync(SignupRequestDto request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var existing = await _db.Users.Find(u => u.Email == normalizedEmail).FirstOrDefaultAsync();
        if (existing is not null)
            throw new ApiException("An account with this email already exists.", 409);

        // Create the Business first so we have an Id to attach to the User.
        var business = new Business
        {
            BusinessName = request.BusinessName.Trim(),
            OwnerName = request.OwnerName.Trim(),
            Email = normalizedEmail,
            MobileNumber = request.MobileNumber.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _db.Businesses.InsertOneAsync(business);

        var user = new User
        {
            BusinessId = business.Id,
            OwnerName = request.OwnerName.Trim(),
            Email = normalizedEmail,
            MobileNumber = request.MobileNumber.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "Owner",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        try
        {
            await _db.Users.InsertOneAsync(user);
        }
        catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            // Roll back the orphaned business record if the unique-email index caught a race condition.
            await _db.Businesses.DeleteOneAsync(b => b.Id == business.Id);
            throw new ApiException("An account with this email already exists.", 409);
        }

        _logger.LogInformation("New business signed up: {BusinessId}", business.Id);

        return BuildAuthResponse(user, business);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _db.Users.Find(u => u.Email == normalizedEmail).FirstOrDefaultAsync();
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new ApiException("Invalid email or password.", 401);

        Business? business = null;
        if (!string.IsNullOrEmpty(user.BusinessId))
        {
            business = await _db.Businesses.Find(b => b.Id == user.BusinessId).FirstOrDefaultAsync();
        }

        return BuildAuthResponse(user, business);
    }

    private AuthResponseDto BuildAuthResponse(User user, Business? business)
    {
        var (token, expiresAt) = _jwtHelper.GenerateToken(user);

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = new UserProfileDto
            {
                Id = user.Id,
                BusinessId = user.BusinessId ?? string.Empty,
                OwnerName = user.OwnerName,
                Email = user.Email,
                MobileNumber = user.MobileNumber,
                BusinessName = business?.BusinessName ?? (user.Role == "Admin" ? "VyaparAI Platform" : string.Empty),
                Role = user.Role ?? "Owner"
            }
        };
    }
}
