using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using VyaparAI.Api.Configuration;
using VyaparAI.Api.Models;

namespace VyaparAI.Api.Helpers;

public class JwtHelper
{
    private readonly JwtSettings _settings;

    public JwtHelper(IOptions<JwtSettings> settings)
    {
        _settings = settings.Value;
    }

    /// <summary>
    /// Generates a signed JWT containing the UserId (sub) and BusinessId as claims.
    /// BusinessId is always read from this claim server-side, never trusted from the client body.
    /// </summary>
    public (string token, DateTime expiresAt) GenerateToken(User user)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(_settings.ExpiryMinutes);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim("businessId", user.BusinessId ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("ownerName", user.OwnerName ?? string.Empty),
            new Claim(ClaimTypes.Role, user.Role ?? "Owner"),
            new Claim("role", user.Role ?? "Owner"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
