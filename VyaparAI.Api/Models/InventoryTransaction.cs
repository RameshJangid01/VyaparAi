using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VyaparAI.Api.Models;

public static class InventoryTransactionType
{
    public const string Purchase = "PURCHASE";
    public const string Sale = "SALE";
    public const string Adjustment = "ADJUSTMENT";
    public const string Return = "RETURN";
}

public class InventoryTransaction
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string BusinessId { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string ProductId { get; set; } = string.Empty;

    /// <summary>PURCHASE, SALE, ADJUSTMENT, RETURN.</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Signed quantity delta applied to stock (+ for increase, - for decrease).</summary>
    public int Quantity { get; set; }

    public int PreviousQuantity { get; set; }
    public int NewQuantity { get; set; }

    /// <summary>"Sale" or "Purchase" or "Manual".</summary>
    public string ReferenceType { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string? ReferenceId { get; set; }

    public DateTime Date { get; set; } = DateTime.UtcNow;
}
