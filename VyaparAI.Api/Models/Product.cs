using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VyaparAI.Api.Models;

public class Product
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string BusinessId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? Brand { get; set; }

    public decimal PurchasePrice { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal GstPercentage { get; set; }

    public int CurrentQuantity { get; set; }
    public int MinimumStockLevel { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string? SupplierId { get; set; }

    public DateTime? ExpiryDate { get; set; }
    public string Unit { get; set; } = "pcs";
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
