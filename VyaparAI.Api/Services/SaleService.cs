using MongoDB.Driver;
using VyaparAI.Api.Data;
using VyaparAI.Api.DTOs.Sales;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;
using VyaparAI.Api.Models;

namespace VyaparAI.Api.Services;

public class SaleService : ISaleService
{
    private readonly MongoDbContext _db;
    private readonly ILogger<SaleService> _logger;

    public SaleService(MongoDbContext db, ILogger<SaleService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<SaleResponseDto> CreateSaleAsync(string businessId, CreateSaleDto request)
    {
        if (request.Items == null || request.Items.Count == 0)
            throw new ApiException("At least one product item is required.", 400);

        // Idempotency check
        if (!string.IsNullOrWhiteSpace(request.ClientRequestId))
        {
            var existingSale = await _db.Sales
                .Find(s => s.BusinessId == businessId && s.ClientRequestId == request.ClientRequestId)
                .FirstOrDefaultAsync();

            if (existingSale != null)
            {
                return MapToResponseDto(existingSale);
            }
        }

        // Fetch products and validate stock
        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _db.Products
            .Find(p => p.BusinessId == businessId && productIds.Contains(p.Id))
            .ToListAsync();

        var productMap = products.ToDictionary(p => p.Id);

        foreach (var item in request.Items)
        {
            if (!productMap.TryGetValue(item.ProductId, out var product))
                throw new ApiException($"Product with ID {item.ProductId} not found in your inventory.", 404);

            if (product.CurrentQuantity < item.Quantity)
                throw new ApiException($"Insufficient stock for '{product.Name}'. In stock: {product.CurrentQuantity}, Requested: {item.Quantity}", 400);
        }

        // Link or create customer
        string? customerId = request.CustomerId;
        string? customerName = request.CustomerName?.Trim();
        Customer? customer = null;

        if (!string.IsNullOrEmpty(customerId))
        {
            customer = await _db.Customers
                .Find(c => c.BusinessId == businessId && c.Id == customerId)
                .FirstOrDefaultAsync();
            if (customer != null)
                customerName = customer.Name;
        }
        else if (!string.IsNullOrWhiteSpace(request.CustomerMobile))
        {
            var mobile = request.CustomerMobile.Trim();
            customer = await _db.Customers
                .Find(c => c.BusinessId == businessId && c.Mobile == mobile)
                .FirstOrDefaultAsync();

            if (customer == null && !string.IsNullOrWhiteSpace(customerName))
            {
                customer = new Customer
                {
                    BusinessId = businessId,
                    Name = customerName,
                    Mobile = mobile,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _db.Customers.InsertOneAsync(customer);
            }

            if (customer != null)
            {
                customerId = customer.Id;
                customerName = customer.Name;
            }
        }

        // Calculate line items and totals strictly on server
        decimal subtotal = 0;
        decimal discountTotal = request.AdditionalDiscount > 0 ? request.AdditionalDiscount : 0;
        decimal gstTotal = 0;
        var saleItems = new List<SaleItem>();
        var inventoryTransactions = new List<InventoryTransaction>();

        foreach (var item in request.Items)
        {
            var product = productMap[item.ProductId];
            var unitPrice = item.UnitPrice > 0 ? item.UnitPrice : product.SellingPrice;
            var gstPercentage = item.GstPercent >= 0 ? item.GstPercent : product.GstPercentage;
            var lineDiscountPercent = Math.Clamp(item.DiscountPercent, 0, 100);

            var lineBase = item.Quantity * unitPrice;
            var lineDiscount = lineBase * (lineDiscountPercent / 100m);
            var lineTaxable = lineBase - lineDiscount;
            var lineGst = lineTaxable * (gstPercentage / 100m);
            var lineTotal = lineTaxable + lineGst;

            subtotal += lineBase;
            discountTotal += lineDiscount;
            gstTotal += lineGst;

            saleItems.Add(new SaleItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Sku = product.Sku,
                Quantity = item.Quantity,
                UnitPrice = unitPrice,
                DiscountPercent = lineDiscountPercent,
                GstPercent = gstPercentage,
                TotalAmount = Math.Round(lineTotal, 2)
            });
        }

        var grandTotal = Math.Round(Math.Max(0, subtotal - discountTotal + gstTotal), 2);
        var paidAmount = request.PaidAmount > 0 ? Math.Min(request.PaidAmount, grandTotal) : (request.PaymentMethod == "Credit" ? 0 : grandTotal);
        var pendingAmount = Math.Round(grandTotal - paidAmount, 2);

        string paymentStatus = pendingAmount <= 0 ? "Paid" : (paidAmount > 0 ? "Partial" : "Unpaid");

        // Generate unique invoice number
        var invoiceCount = await _db.Sales.CountDocumentsAsync(s => s.BusinessId == businessId);
        var invoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{(invoiceCount + 1):D4}";

        var sale = new Sale
        {
            BusinessId = businessId,
            InvoiceNumber = invoiceNumber,
            CustomerId = customerId,
            CustomerName = customerName ?? "Walk-in Customer",
            Items = saleItems,
            Subtotal = Math.Round(subtotal, 2),
            DiscountTotal = Math.Round(discountTotal, 2),
            GstTotal = Math.Round(gstTotal, 2),
            GrandTotal = grandTotal,
            PaidAmount = Math.Round(paidAmount, 2),
            PendingAmount = pendingAmount,
            PaymentMethod = request.PaymentMethod,
            PaymentStatus = paymentStatus,
            ClientRequestId = request.ClientRequestId,
            CreatedAt = DateTime.UtcNow
        };

        await _db.Sales.InsertOneAsync(sale);

        // Deduct inventory and record transactions
        foreach (var item in saleItems)
        {
            var product = productMap[item.ProductId];
            var prevQty = product.CurrentQuantity;
            var newQty = prevQty - item.Quantity;

            await _db.Products.UpdateOneAsync(
                p => p.Id == product.Id && p.BusinessId == businessId,
                Builders<Product>.Update
                    .Set(p => p.CurrentQuantity, newQty)
                    .Set(p => p.UpdatedAt, DateTime.UtcNow));

            inventoryTransactions.Add(new InventoryTransaction
            {
                BusinessId = businessId,
                ProductId = product.Id,
                Type = InventoryTransactionType.Sale,
                Quantity = -item.Quantity,
                PreviousQuantity = prevQty,
                NewQuantity = newQty,
                ReferenceType = "Sale",
                ReferenceId = sale.Id,
                Date = DateTime.UtcNow
            });
        }

        if (inventoryTransactions.Count > 0)
        {
            await _db.InventoryTransactions.InsertManyAsync(inventoryTransactions);
        }

        // Update customer totals
        if (customer != null)
        {
            await _db.Customers.UpdateOneAsync(
                c => c.Id == customer.Id && c.BusinessId == businessId,
                Builders<Customer>.Update
                    .Inc(c => c.TotalPurchases, grandTotal)
                    .Inc(c => c.TotalPaid, paidAmount)
                    .Inc(c => c.PendingAmount, pendingAmount)
                    .Set(c => c.UpdatedAt, DateTime.UtcNow));
        }

        _logger.LogInformation("Completed sale {InvoiceNumber} for business {BusinessId}, Total: {GrandTotal}",
            sale.InvoiceNumber, businessId, sale.GrandTotal);

        return MapToResponseDto(sale);
    }

    public async Task<PagedResult<SaleResponseDto>> ListSalesAsync(string businessId, int page = 1, int pageSize = 10, string? search = null, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var filterBuilder = Builders<Sale>.Filter;
        var filter = filterBuilder.Eq(s => s.BusinessId, businessId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            filter &= (filterBuilder.Regex(s => s.InvoiceNumber, new MongoDB.Bson.BsonRegularExpression(term, "i"))
                     | filterBuilder.Regex(s => s.CustomerName, new MongoDB.Bson.BsonRegularExpression(term, "i")));
        }

        if (fromDate.HasValue)
            filter &= filterBuilder.Gte(s => s.CreatedAt, fromDate.Value.Date);

        if (toDate.HasValue)
            filter &= filterBuilder.Lte(s => s.CreatedAt, toDate.Value.Date.AddDays(1).AddTicks(-1));

        var totalCount = await _db.Sales.CountDocumentsAsync(filter);

        var sales = await _db.Sales
            .Find(filter)
            .SortByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return new PagedResult<SaleResponseDto>
        {
            Items = sales.Select(MapToResponseDto).ToList(),
            TotalCount = (int)totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<SaleResponseDto> GetSaleByIdAsync(string businessId, string saleId)
    {
        var sale = await _db.Sales
            .Find(s => s.BusinessId == businessId && s.Id == saleId)
            .FirstOrDefaultAsync();

        if (sale == null)
            throw new ApiException("Sale record not found.", 404);

        return MapToResponseDto(sale);
    }

    public async Task<InvoiceDto> GetInvoiceAsync(string businessId, string saleId)
    {
        var sale = await _db.Sales
            .Find(s => s.BusinessId == businessId && s.Id == saleId)
            .FirstOrDefaultAsync();

        if (sale == null)
            throw new ApiException("Sale record not found for invoice generation.", 404);

        var business = await _db.Businesses
            .Find(b => b.Id == businessId)
            .FirstOrDefaultAsync();

        Customer? customer = null;
        if (!string.IsNullOrEmpty(sale.CustomerId))
        {
            customer = await _db.Customers
                .Find(c => c.BusinessId == businessId && c.Id == sale.CustomerId)
                .FirstOrDefaultAsync();
        }

        return new InvoiceDto
        {
            InvoiceNumber = sale.InvoiceNumber,
            InvoiceDate = sale.CreatedAt,
            BusinessName = business?.BusinessName ?? "VyaparAI Retail",
            BusinessAddress = business?.Address,
            BusinessGstNumber = business?.GstNumber,
            BusinessMobile = business?.MobileNumber,
            BusinessEmail = business?.Email,
            CustomerName = sale.CustomerName ?? customer?.Name ?? "Walk-in Customer",
            CustomerMobile = customer?.Mobile,
            CustomerAddress = customer?.Address,
            Items = sale.Items.Select(i => new SaleItemResponseDto
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Sku = i.Sku,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                DiscountPercent = i.DiscountPercent,
                GstPercent = i.GstPercent,
                TotalAmount = i.TotalAmount
            }).ToList(),
            Subtotal = sale.Subtotal,
            DiscountTotal = sale.DiscountTotal,
            GstTotal = sale.GstTotal,
            GrandTotal = sale.GrandTotal,
            PaidAmount = sale.PaidAmount,
            BalanceAmount = sale.PendingAmount,
            PaymentMethod = sale.PaymentMethod,
            PaymentStatus = sale.PaymentStatus,
            Currency = business?.Currency ?? "INR"
        };
    }

    private static SaleResponseDto MapToResponseDto(Sale sale)
    {
        return new SaleResponseDto
        {
            Id = sale.Id,
            BusinessId = sale.BusinessId,
            InvoiceNumber = sale.InvoiceNumber,
            CustomerId = sale.CustomerId,
            CustomerName = sale.CustomerName,
            Items = sale.Items.Select(i => new SaleItemResponseDto
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Sku = i.Sku,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                DiscountPercent = i.DiscountPercent,
                GstPercent = i.GstPercent,
                TotalAmount = i.TotalAmount
            }).ToList(),
            Subtotal = sale.Subtotal,
            DiscountTotal = sale.DiscountTotal,
            GstTotal = sale.GstTotal,
            GrandTotal = sale.GrandTotal,
            PaidAmount = sale.PaidAmount,
            PendingAmount = sale.PendingAmount,
            PaymentMethod = sale.PaymentMethod,
            PaymentStatus = sale.PaymentStatus,
            CreatedAt = sale.CreatedAt
        };
    }
}
