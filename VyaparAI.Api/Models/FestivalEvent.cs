using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VyaparAI.Api.Models;

/// <summary>
/// Configured/seeded event record. Never computed by the AI -- lunar/religious
/// festival dates are looked up and stored here so the system never hallucinates dates.
/// </summary>
public class FestivalEvent
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Region { get; set; } = "India";
    public List<string> RelevantCategories { get; set; } = new();

    /// <summary>Multiplier applied to baseline demand for relevant categories, e.g. 1.6 = +60%.</summary>
    public double DemandMultiplier { get; set; } = 1.0;

    public string? Description { get; set; }
}
