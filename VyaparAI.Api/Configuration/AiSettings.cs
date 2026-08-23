namespace VyaparAI.Api.Configuration;

/// <summary>
/// Gemini API configuration. The key NEVER leaves the backend.
/// Populated later in Phase 6 (AI integration) but the shape is defined
/// now so DI wiring in Program.cs is stable across phases.
/// </summary>
public class AiSettings
{
    public string GeminiApiKey { get; set; } = string.Empty;
    public string GeminiModel { get; set; } = "gemini-2.0-flash";
}
