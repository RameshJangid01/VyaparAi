using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VyaparAI.Api.Models;

public class Sale
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string BusinessId { get; set; } = string.Empty;

    public string InvoiceNumber { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string? CustomerId { get; set; }
    public string? CustomerName { get; set; }

    public List<SaleItem> Items { get; set; } = new();

    public decimal Subtotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal GstTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal PendingAmount { get; set; }

    public string PaymentMethod { get; set; } = "Cash";
    public string PaymentStatus { get; set; } = "Paid"; // Paid, Partial, Unpaid

    /// <summary>Idempotency key supplied by the client to prevent duplicate bills on double-submit.</summary>
    public string? ClientRequestId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
