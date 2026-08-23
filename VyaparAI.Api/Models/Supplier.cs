using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VyaparAI.Api.Models;

public class Supplier
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string BusinessId { get; set; } = string.Empty;

    public string SupplierName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string Mobile { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? GstNumber { get; set; }
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal TotalPurchases { get; set; }
    [BsonRepresentation(BsonType.Decimal128)]

    public decimal Paid { get; set; }
    [BsonRepresentation(BsonType.Decimal128)]

    public decimal Pending { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
