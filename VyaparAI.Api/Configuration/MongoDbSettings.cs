namespace VyaparAI.Api.Configuration;

/// <summary>
/// Bound from environment variables / appsettings.
/// MONGODB_CONNECTION_STRING and MONGODB_DATABASE_NAME.
/// </summary>
public class MongoDbSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = "VyaparAI";
}
