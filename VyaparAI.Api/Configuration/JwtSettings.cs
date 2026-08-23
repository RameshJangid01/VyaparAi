namespace VyaparAI.Api.Configuration;

public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "VyaparAI";
    public string Audience { get; set; } = "VyaparAIUsers";
    public int ExpiryMinutes { get; set; } = 1440; // 24 hours, good for a demo session
}
