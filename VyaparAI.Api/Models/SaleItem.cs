using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VyaparAI.Api.Models;

/// <summary>Embedded line item within a Sale document.</summary>
public class SaleItem
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string ProductId { get; set; } = string.Empty;

    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal GstPercent { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal TotalAmount { get; set; }
}
