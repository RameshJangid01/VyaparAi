using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VyaparAI.Api.Models;

public class Customer
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string BusinessId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }

    // IMPORTANT: Store monetary values as MongoDB Decimal128
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal TotalPurchases { get; set; }

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal TotalPaid { get; set; }

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal PendingAmount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}