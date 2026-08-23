using MongoDB.Driver;
using VyaparAI.Api.Data;
using VyaparAI.Api.DTOs.Purchases;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;
using VyaparAI.Api.Models;

namespace VyaparAI.Api.Services;

public class PurchaseService : IPurchaseService
{
    private readonly MongoDbContext _db;
    private readonly ILogger<PurchaseService> _logger;

    public PurchaseService(MongoDbContext db, ILogger<PurchaseService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PurchaseResponseDto> CreatePurchaseAsync(string businessId, CreatePurchaseDto request)
    {
        if (request.Items == null || request.Items.Count == 0)
            throw new ApiException("At least one product item is required for a purchase.", 400);

        var supplier = await _db.Suppliers
            .Find(s => s.BusinessId == businessId && s.Id == request.SupplierId)
            .FirstOrDefaultAsync();

        if (supplier == null)
            throw new ApiException("Supplier not found in your business records.", 404);

        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _db.Products
            .Find(p => p.BusinessId == businessId && productIds.Contains(p.Id))
            .ToListAsync();

        var productMap = products.ToDictionary(p => p.Id);

        decimal subtotal = 0;
        decimal discountTotal = 0;
        decimal gstTotal = 0;
        var purchaseItems = new List<PurchaseItem>();
        var inventoryTransactions = new List<InventoryTransaction>();

        foreach (var item in request.Items)
        {
            if (!productMap.TryGetValue(item.ProductId, out var product))
                throw new ApiException($"Product with ID {item.ProductId} not found.", 404);

            var unitPrice = item.PurchasePrice > 0 ? item.PurchasePrice : product.PurchasePrice;
            var gstPercent = item.GstPercent >= 0 ? item.GstPercent : product.GstPercentage;
            var discountPercent = Math.Clamp(item.DiscountPercent, 0, 100);

            var lineBase = item.Quantity * unitPrice;
            var lineDiscount = lineBase * (discountPercent / 100m);
            var lineTaxable = lineBase - lineDiscount;
            var lineGst = lineTaxable * (gstPercent / 100m);
            var lineTotal = lineTaxable + lineGst;

            subtotal += lineBase;
            discountTotal += lineDiscount;
            gstTotal += lineGst;

            purchaseItems.Add(new PurchaseItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Quantity = item.Quantity,
                PurchasePrice = unitPrice,
                GstPercent = gstPercent,
                DiscountPercent = discountPercent,
                TotalAmount = Math.Round(lineTotal, 2)
            });
        }

        var grandTotal = Math.Round(Math.Max(0, subtotal - discountTotal + gstTotal), 2);
        var paidAmount = Math.Min(request.PaidAmount, grandTotal);
        var pendingAmount = Math.Round(grandTotal - paidAmount, 2);

        string paymentStatus = pendingAmount <= 0 ? "Paid" : (paidAmount > 0 ? "Partial" : "Unpaid");

        var purchaseCount = await _db.Purchases.CountDocumentsAsync(p => p.BusinessId == businessId);
        var invoiceNumber = !string.IsNullOrWhiteSpace(request.InvoiceNumber)
            ? request.InvoiceNumber.Trim()
            : $"PO-{DateTime.UtcNow:yyyyMMdd}-{(purchaseCount + 1):D4}";

        var purchase = new Purchase
        {
            BusinessId = businessId,
            SupplierId = supplier.Id,
            SupplierName = supplier.SupplierName,
            InvoiceNumber = invoiceNumber,
            PurchaseDate = request.PurchaseDate ?? DateTime.UtcNow,
            Items = purchaseItems,
            Subtotal = Math.Round(subtotal, 2),
            DiscountTotal = Math.Round(discountTotal, 2),
            GstTotal = Math.Round(gstTotal, 2),
            GrandTotal = grandTotal,
            PaidAmount = Math.Round(paidAmount, 2),
            PendingAmount = pendingAmount,
            PaymentStatus = paymentStatus,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        await _db.Purchases.InsertOneAsync(purchase);

        // Increase product stock and update cost price
        foreach (var item in purchaseItems)
        {
            var product = productMap[item.ProductId];
            var prevQty = product.CurrentQuantity;
            var newQty = prevQty + item.Quantity;

            await _db.Products.UpdateOneAsync(
                p => p.Id == product.Id && p.BusinessId == businessId,
                Builders<Product>.Update
                    .Set(p => p.CurrentQuantity, newQty)
                    .Set(p => p.PurchasePrice, item.PurchasePrice)
                    .Set(p => p.SupplierId, supplier.Id)
                    .Set(p => p.UpdatedAt, DateTime.UtcNow));

            inventoryTransactions.Add(new InventoryTransaction
            {
                BusinessId = businessId,
                ProductId = product.Id,
                Type = InventoryTransactionType.Purchase,
                Quantity = item.Quantity,
                PreviousQuantity = prevQty,
                NewQuantity = newQty,
                ReferenceType = "Purchase",
                ReferenceId = purchase.Id,
                Date = DateTime.UtcNow
            });
        }

        if (inventoryTransactions.Count > 0)
        {
            await _db.InventoryTransactions.InsertManyAsync(inventoryTransactions);
        }

        // Update supplier purchase balance
        await _db.Suppliers.UpdateOneAsync(
            s => s.Id == supplier.Id && s.BusinessId == businessId,
            Builders<Supplier>.Update
                .Inc(s => s.TotalPurchases, grandTotal)
                .Inc(s => s.Paid, paidAmount)
                .Inc(s => s.Pending, pendingAmount)
                .Set(s => s.UpdatedAt, DateTime.UtcNow));

        _logger.LogInformation("Recorded purchase {InvoiceNumber} from {SupplierName}, Total: {GrandTotal}",
            purchase.InvoiceNumber, supplier.SupplierName, purchase.GrandTotal);

        return MapToResponseDto(purchase);
    }

    public async Task<PagedResult<PurchaseResponseDto>> ListPurchasesAsync(string businessId, int page = 1, int pageSize = 10, string? supplierId = null, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var filterBuilder = Builders<Purchase>.Filter;
        var filter = filterBuilder.Eq(p => p.BusinessId, businessId);

        if (!string.IsNullOrEmpty(supplierId))
            filter &= filterBuilder.Eq(p => p.SupplierId, supplierId);

        if (fromDate.HasValue)
            filter &= filterBuilder.Gte(p => p.PurchaseDate, fromDate.Value.Date);

        if (toDate.HasValue)
            filter &= filterBuilder.Lte(p => p.PurchaseDate, toDate.Value.Date.AddDays(1).AddTicks(-1));

        var totalCount = await _db.Purchases.CountDocumentsAsync(filter);

        var purchases = await _db.Purchases
            .Find(filter)
            .SortByDescending(p => p.PurchaseDate)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return new PagedResult<PurchaseResponseDto>
        {
            Items = purchases.Select(MapToResponseDto).ToList(),
            TotalCount = (int)totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PurchaseResponseDto> GetPurchaseByIdAsync(string businessId, string purchaseId)
    {
        var purchase = await _db.Purchases
            .Find(p => p.BusinessId == businessId && p.Id == purchaseId)
            .FirstOrDefaultAsync();

        if (purchase == null)
            throw new ApiException("Purchase record not found.", 404);

        return MapToResponseDto(purchase);
    }

    private static PurchaseResponseDto MapToResponseDto(Purchase purchase)
    {
        return new PurchaseResponseDto
        {
            Id = purchase.Id,
            BusinessId = purchase.BusinessId,
            SupplierId = purchase.SupplierId,
            SupplierName = purchase.SupplierName,
            InvoiceNumber = purchase.InvoiceNumber,
            PurchaseDate = purchase.PurchaseDate,
            Items = purchase.Items.Select(i => new PurchaseItemResponseDto
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                PurchasePrice = i.PurchasePrice,
                GstPercent = i.GstPercent,
                DiscountPercent = i.DiscountPercent,
                TotalAmount = i.TotalAmount
            }).ToList(),
            Subtotal = purchase.Subtotal,
            DiscountTotal = purchase.DiscountTotal,
            GstTotal = purchase.GstTotal,
            GrandTotal = purchase.GrandTotal,
            PaidAmount = purchase.PaidAmount,
            PendingAmount = purchase.PendingAmount,
            PaymentStatus = purchase.PaymentStatus,
            Notes = purchase.Notes,
            CreatedAt = purchase.CreatedAt
        };
    }
}
