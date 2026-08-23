using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VyaparAI.Api.Models;

public class Purchase
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string BusinessId { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string SupplierId { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;

    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;

    public List<PurchaseItem> Items { get; set; } = new();

    public decimal Subtotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal GstTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal PendingAmount { get; set; }

    public string PaymentStatus { get; set; } = "Paid"; // Paid, Partial, Unpaid
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
