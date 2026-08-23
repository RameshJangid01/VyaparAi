using Microsoft.Extensions.Options;
using MongoDB.Driver;
using VyaparAI.Api.Configuration;
using VyaparAI.Api.Models;

namespace VyaparAI.Api.Data;

/// <summary>
/// Single point of access to all MongoDB collections. Injected as a singleton.
/// Every collection that stores business data MUST be filtered by BusinessId
/// at the service layer -- this context does not enforce isolation by itself.
/// </summary>
public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        _database = client.GetDatabase(settings.Value.DatabaseName);
    }

    public IMongoCollection<User> Users => _database.GetCollection<User>("users");
    public IMongoCollection<Business> Businesses => _database.GetCollection<Business>("businesses");
    public IMongoCollection<Product> Products => _database.GetCollection<Product>("products");
    public IMongoCollection<Customer> Customers => _database.GetCollection<Customer>("customers");
    public IMongoCollection<Supplier> Suppliers => _database.GetCollection<Supplier>("suppliers");
    public IMongoCollection<Sale> Sales => _database.GetCollection<Sale>("sales");
    public IMongoCollection<Purchase> Purchases => _database.GetCollection<Purchase>("purchases");
    public IMongoCollection<InventoryTransaction> InventoryTransactions => _database.GetCollection<InventoryTransaction>("inventoryTransactions");
    public IMongoCollection<AiInsight> AiInsights => _database.GetCollection<AiInsight>("aiInsights");
    public IMongoCollection<FestivalEvent> FestivalEvents => _database.GetCollection<FestivalEvent>("festivalEvents");

    /// <summary>
    /// Creates indexes required for correctness and performance.
    /// Called once at startup (see Program.cs).
    /// </summary>
    public async Task EnsureIndexesAsync()
    {
        var userEmailIndex = new CreateIndexModel<User>(
            Builders<User>.IndexKeys.Ascending(u => u.Email),
            new CreateIndexOptions { Unique = true });
        await Users.Indexes.CreateOneAsync(userEmailIndex);

        var productBusinessIndex = new CreateIndexModel<Product>(
            Builders<Product>.IndexKeys.Ascending(p => p.BusinessId));
        var productSkuIndex = new CreateIndexModel<Product>(
            Builders<Product>.IndexKeys.Ascending(p => p.BusinessId).Ascending(p => p.Sku));
        await Products.Indexes.CreateManyAsync(new[] { productBusinessIndex, productSkuIndex });

        var saleBusinessIndex = new CreateIndexModel<Sale>(
            Builders<Sale>.IndexKeys.Ascending(s => s.BusinessId).Descending(s => s.CreatedAt));
        var saleInvoiceIndex = new CreateIndexModel<Sale>(
            Builders<Sale>.IndexKeys.Ascending(s => s.BusinessId).Ascending(s => s.InvoiceNumber),
            new CreateIndexOptions { Unique = true });
        await Sales.Indexes.CreateManyAsync(new[] { saleBusinessIndex, saleInvoiceIndex });

        var purchaseBusinessIndex = new CreateIndexModel<Purchase>(
            Builders<Purchase>.IndexKeys.Ascending(p => p.BusinessId).Descending(p => p.CreatedAt));
        await Purchases.Indexes.CreateOneAsync(purchaseBusinessIndex);

        var invTxnIndex = new CreateIndexModel<InventoryTransaction>(
            Builders<InventoryTransaction>.IndexKeys.Ascending(t => t.BusinessId).Ascending(t => t.ProductId).Descending(t => t.Date));
        await InventoryTransactions.Indexes.CreateOneAsync(invTxnIndex);

        var customerBusinessIndex = new CreateIndexModel<Customer>(
            Builders<Customer>.IndexKeys.Ascending(c => c.BusinessId));
        await Customers.Indexes.CreateOneAsync(customerBusinessIndex);

        var supplierBusinessIndex = new CreateIndexModel<Supplier>(
            Builders<Supplier>.IndexKeys.Ascending(s => s.BusinessId));
        await Suppliers.Indexes.CreateOneAsync(supplierBusinessIndex);
    }
}
