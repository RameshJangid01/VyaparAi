using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace VyaparAI.Api.Helpers;

/// <summary>
/// Reads identity from the validated JWT only. Controllers must use these
/// instead of ever trusting a BusinessId/UserId supplied in a request body.
/// </summary>
public static class ClaimsPrincipalExtensions
{
    public static string GetBusinessId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue("businessId");
        if (string.IsNullOrEmpty(value))
            throw new UnauthorizedAccessException("Business context missing from token.");
        return value;
    }

    public static string GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
                    ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(value))
            throw new UnauthorizedAccessException("User context missing from token.");
        return value;
    }

    public static string GetRole(this ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.Role)
               ?? user.FindFirstValue("role")
               ?? "Owner";
    }

    public static bool IsAdmin(this ClaimsPrincipal user)
    {
        var role = user.GetRole();
        return string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase);
    }
}
