using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VyaparAI.Api.Models;

public class AiInsight
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string BusinessId { get; set; } = string.Empty;

    /// <summary>SALES_INSIGHT, INVENTORY_ALERT, FESTIVAL_OPPORTUNITY, PROFIT_INSIGHT, etc.</summary>
    public string Type { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    /// <summary>LOW, MEDIUM, HIGH — how confident the underlying calculation is.</summary>
    public string Confidence { get; set; } = "MEDIUM";

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}
