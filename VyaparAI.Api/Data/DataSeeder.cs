using MongoDB.Driver;
using VyaparAI.Api.Models;

namespace VyaparAI.Api.Data;

public class DataSeeder
{
    private readonly MongoDbContext _db;
    private readonly ILogger<DataSeeder> _logger;

    public DataSeeder(MongoDbContext db, ILogger<DataSeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        try
        {
            await SeedAdminUserAsync();
            await SeedDemoBusinessAndDataAsync();
            await SeedFestivalsAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred during database seeding.");
        }
    }

    private async Task SeedAdminUserAsync()
    {
        var adminEmail = "admin@vyaparai.com";
        var existingAdmin = await _db.Users.Find(u => u.Email == adminEmail).FirstOrDefaultAsync();
        var hash = BCrypt.Net.BCrypt.HashPassword("Admin123!");

        if (existingAdmin == null)
        {
            var adminUser = new User
            {
                Email = adminEmail,
                OwnerName = "VyaparAI Administrator",
                MobileNumber = "9999999999",
                PasswordHash = hash,
                Role = "Admin",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _db.Users.InsertOneAsync(adminUser);
            _logger.LogInformation("Seeded admin account: {AdminEmail}", adminEmail);
        }
        else
        {
            await _db.Users.UpdateOneAsync(
                u => u.Id == existingAdmin.Id,
                Builders<User>.Update
                    .Set(u => u.PasswordHash, hash)
                    .Set(u => u.Role, "Admin")
                    .Set(u => u.UpdatedAt, DateTime.UtcNow));
        }
    }

    private async Task SeedDemoBusinessAndDataAsync()
    {
        var demoEmail = "demo@vyaparai.com";
        var existingUser = await _db.Users.Find(u => u.Email == demoEmail).FirstOrDefaultAsync();
        var demoHash = BCrypt.Net.BCrypt.HashPassword("Password123!");

        string businessId;
        if (existingUser == null)
        {
            var business = new Business
            {
                BusinessName = "Sharma Kirana & General Store",
                OwnerName = "Ramesh Sharma",
                Email = demoEmail,
                MobileNumber = "9876543210",
                Address = "Shop #14, Main Market, Sector 18, Noida, Uttar Pradesh 201301",
                GstNumber = "07AAAAA0000A1Z5",
                Currency = "INR",
                CreatedAt = DateTime.UtcNow.AddDays(-60),
                UpdatedAt = DateTime.UtcNow
            };
            await _db.Businesses.InsertOneAsync(business);
            businessId = business.Id;

            var user = new User
            {
                BusinessId = businessId,
                OwnerName = "Ramesh Sharma",
                Email = demoEmail,
                MobileNumber = "9876543210",
                PasswordHash = demoHash,
                Role = "Owner",
                CreatedAt = DateTime.UtcNow.AddDays(-60),
                UpdatedAt = DateTime.UtcNow
            };
            await _db.Users.InsertOneAsync(user);

            // Also seed owner@vyaparai.com for convenience
            var altUser = new User
            {
                BusinessId = businessId,
                OwnerName = "Ramesh Sharma",
                Email = "owner@vyaparai.com",
                MobileNumber = "9876543210",
                PasswordHash = demoHash,
                Role = "Owner",
                CreatedAt = DateTime.UtcNow.AddDays(-60),
                UpdatedAt = DateTime.UtcNow
            };
            await _db.Users.InsertOneAsync(altUser);

            _logger.LogInformation("Created demo business and users for {BusinessName}", business.BusinessName);
        }
        else
        {
            businessId = existingUser.BusinessId;
            await _db.Users.UpdateOneAsync(
                u => u.Id == existingUser.Id,
                Builders<User>.Update
                    .Set(u => u.PasswordHash, demoHash)
                    .Set(u => u.Role, "Owner")
                    .Set(u => u.UpdatedAt, DateTime.UtcNow));
        }

        // Check if products exist
        var productCount = await _db.Products.CountDocumentsAsync(p => p.BusinessId == businessId);
        if (productCount > 0)
        {
            return; // Already populated
        }

        // 1. Seed Suppliers
        var suppliers = new List<Supplier>
        {
            new() { BusinessId = businessId, SupplierName = "Amul Dairy Distributors", ContactPerson = "Vikas Anand", Mobile = "9811223344", Email = "amul.supply@gmail.com", Address = "Noida Phase 2 Industrial Area", GstNumber = "07AAACA1234B1Z2", TotalPurchases = 45000, Paid = 40000, Pending = 5000 },
            new() { BusinessId = businessId, SupplierName = "Nestle & Parle Wholesale Agency", ContactPerson = "Sunil Gupta", Mobile = "9822334455", Email = "sunil.wholesale@gmail.com", Address = "Ghaziabad Wholesale Mandi", GstNumber = "09BBBCB2345C1Z3", TotalPurchases = 62000, Paid = 62000, Pending = 0 },
            new() { BusinessId = businessId, SupplierName = "Hindustan Unilever Depot", ContactPerson = "Deepak Verma", Mobile = "9833445566", Email = "hul.distributors@gmail.com", Address = "Okhla Phase 1, New Delhi", GstNumber = "07CCCCD3456D1Z4", TotalPurchases = 88000, Paid = 80000, Pending = 8000 },
            new() { BusinessId = businessId, SupplierName = "Fortune & Tata Oil/Spices Agency", ContactPerson = "Manoj Aggarwal", Mobile = "9844556677", Email = "fortune.wholesale@gmail.com", Address = "Khari Baoli, Old Delhi", GstNumber = "07DDDDE4567E1Z5", TotalPurchases = 95000, Paid = 90000, Pending = 5000 }
        };
        await _db.Suppliers.InsertManyAsync(suppliers);

        var supAmul = suppliers[0].Id;
        var supNestle = suppliers[1].Id;
        var supHul = suppliers[2].Id;
        var supFortune = suppliers[3].Id;

        // 2. Seed 25 Realistic Indian FMCG Products
        var products = new List<Product>
        {
            // Groceries & Staples
            new() { BusinessId = businessId, Name = "Aashirvaad Superior MP Atta (10kg)", Sku = "ATT-AASH-10K", Barcode = "8901030000011", Category = "Groceries", Brand = "Aashirvaad", PurchasePrice = 380, SellingPrice = 440, GstPercentage = 0, CurrentQuantity = 32, MinimumStockLevel = 10, SupplierId = supFortune, Unit = "pkt" },
            new() { BusinessId = businessId, Name = "Fortune Sunlite Refined Sunflower Oil (1L)", Sku = "OIL-FORT-1L", Barcode = "8901030000022", Category = "Groceries", Brand = "Fortune", PurchasePrice = 115, SellingPrice = 135, GstPercentage = 5, CurrentQuantity = 45, MinimumStockLevel = 15, SupplierId = supFortune, Unit = "pkt" },
            new() { BusinessId = businessId, Name = "Daawat Rozana Super Basmati Rice (5kg)", Sku = "RIC-DAAW-5K", Barcode = "8901030000033", Category = "Groceries", Brand = "Daawat", PurchasePrice = 340, SellingPrice = 410, GstPercentage = 0, CurrentQuantity = 18, MinimumStockLevel = 8, SupplierId = supFortune, Unit = "pkt" },
            new() { BusinessId = businessId, Name = "Tata Salt Vaccum Evaporated (1kg)", Sku = "SLT-TATA-1K", Barcode = "8901030000044", Category = "Groceries", Brand = "Tata", PurchasePrice = 22, SellingPrice = 28, GstPercentage = 0, CurrentQuantity = 60, MinimumStockLevel = 20, SupplierId = supFortune, Unit = "pkt" },
            new() { BusinessId = businessId, Name = "Tata Sampann Unpolished Toor Dal (1kg)", Sku = "DAL-TATA-1K", Barcode = "8901030000055", Category = "Groceries", Brand = "Tata", PurchasePrice = 145, SellingPrice = 175, GstPercentage = 0, CurrentQuantity = 22, MinimumStockLevel = 10, SupplierId = supFortune, Unit = "pkt" },
            new() { BusinessId = businessId, Name = "Sugar Sulphur Free (1kg)", Sku = "SGR-SULP-1K", Barcode = "8901030000066", Category = "Groceries", Brand = "Madhur", PurchasePrice = 40, SellingPrice = 48, GstPercentage = 5, CurrentQuantity = 8, MinimumStockLevel = 15, SupplierId = supFortune, Unit = "kg" }, // Low stock

            // Beverages & Dairy
            new() { BusinessId = businessId, Name = "Amul Butter Pasteurized (500g)", Sku = "DAI-AMUL-500", Barcode = "8901030000077", Category = "Dairy", Brand = "Amul", PurchasePrice = 245, SellingPrice = 275, GstPercentage = 12, CurrentQuantity = 14, MinimumStockLevel = 8, SupplierId = supAmul, Unit = "pcs" },
            new() { BusinessId = businessId, Name = "Amul Taaza Toned Milk (1L Tetra)", Sku = "DAI-AMUL-1L", Barcode = "8901030000088", Category = "Dairy", Brand = "Amul", PurchasePrice = 64, SellingPrice = 74, GstPercentage = 5, CurrentQuantity = 40, MinimumStockLevel = 12, SupplierId = supAmul, Unit = "pcs" },
            new() { BusinessId = businessId, Name = "Tata Tea Gold Premium Blend (500g)", Sku = "BEV-TATA-500", Barcode = "8901030000099", Category = "Beverages", Brand = "Tata", PurchasePrice = 255, SellingPrice = 310, GstPercentage = 5, CurrentQuantity = 25, MinimumStockLevel = 10, SupplierId = supFortune, Unit = "pkt" },
            new() { BusinessId = businessId, Name = "Nescafe Classic Instant Coffee Jar (100g)", Sku = "BEV-NESC-100", Barcode = "8901030000100", Category = "Beverages", Brand = "Nescafe", PurchasePrice = 290, SellingPrice = 360, GstPercentage = 18, CurrentQuantity = 19, MinimumStockLevel = 8, SupplierId = supNestle, Unit = "pcs" },
            new() { BusinessId = businessId, Name = "Coca-Cola Original Taste (750ml)", Sku = "BEV-COKE-750", Barcode = "8901030000111", Category = "Beverages", Brand = "Coca-Cola", PurchasePrice = 34, SellingPrice = 45, GstPercentage = 28, CurrentQuantity = 50, MinimumStockLevel = 20, SupplierId = supNestle, Unit = "btl" },
            new() { BusinessId = businessId, Name = "Frooti Mango Drink (1.2L)", Sku = "BEV-FROO-1L", Barcode = "8901030000122", Category = "Beverages", Brand = "Parle", PurchasePrice = 52, SellingPrice = 70, GstPercentage = 12, CurrentQuantity = 3, MinimumStockLevel = 10, SupplierId = supNestle, Unit = "btl" }, // Low stock

            // Snacks & Biscuits
            new() { BusinessId = businessId, Name = "Maggi 2-Minute Masala Noodles (Pack of 4)", Sku = "SNK-MAGG-4P", Barcode = "8901030000133", Category = "Snacks", Brand = "Maggi", PurchasePrice = 50, SellingPrice = 60, GstPercentage = 12, CurrentQuantity = 65, MinimumStockLevel = 20, SupplierId = supNestle, Unit = "pkt" },
            new() { BusinessId = businessId, Name = "Parle-G Original Glucose Biscuits (800g)", Sku = "SNK-PARL-800", Barcode = "8901030000144", Category = "Snacks", Brand = "Parle", PurchasePrice = 65, SellingPrice = 80, GstPercentage = 18, CurrentQuantity = 48, MinimumStockLevel = 15, SupplierId = supNestle, Unit = "pkt" },
            new() { BusinessId = businessId, Name = "Britannia Good Day Cashew Cookies (200g)", Sku = "SNK-BRIT-200", Barcode = "8901030000155", Category = "Snacks", Brand = "Britannia", PurchasePrice = 38, SellingPrice = 50, GstPercentage = 18, CurrentQuantity = 55, MinimumStockLevel = 15, SupplierId = supNestle, Unit = "pkt" },
            new() { BusinessId = businessId, Name = "Lay's India's Magic Masala Chips (50g)", Sku = "SNK-LAYS-50G", Barcode = "8901030000166", Category = "Snacks", Brand = "Lay's", PurchasePrice = 16, SellingPrice = 20, GstPercentage = 12, CurrentQuantity = 70, MinimumStockLevel = 25, SupplierId = supNestle, Unit = "pkt" },
            new() { BusinessId = businessId, Name = "Kurkure Masala Munch (90g)", Sku = "SNK-KURK-90G", Barcode = "8901030000177", Category = "Snacks", Brand = "Kurkure", PurchasePrice = 16, SellingPrice = 20, GstPercentage = 12, CurrentQuantity = 5, MinimumStockLevel = 20, SupplierId = supNestle, Unit = "pkt" }, // Low stock
            new() { BusinessId = businessId, Name = "Cadbury Dairy Milk Silk Chocolate (150g)", Sku = "SNK-CADB-150", Barcode = "8901030000188", Category = "Snacks", Brand = "Cadbury", PurchasePrice = 140, SellingPrice = 175, GstPercentage = 18, CurrentQuantity = 2, MinimumStockLevel = 10, SupplierId = supNestle, Unit = "pcs" }, // Low stock

            // Personal Care
            new() { BusinessId = businessId, Name = "Dettol Original Germ Protection Soap (Pack of 4)", Sku = "PC-DETT-4P", Barcode = "8901030000199", Category = "Personal Care", Brand = "Dettol", PurchasePrice = 135, SellingPrice = 165, GstPercentage = 18, CurrentQuantity = 28, MinimumStockLevel = 10, SupplierId = supHul, Unit = "pkt" },
            new() { BusinessId = businessId, Name = "Dove Cream Beauty Bathing Bar (100g)", Sku = "PC-DOVE-100", Barcode = "8901030000200", Category = "Personal Care", Brand = "Dove", PurchasePrice = 52, SellingPrice = 65, GstPercentage = 18, CurrentQuantity = 35, MinimumStockLevel = 10, SupplierId = supHul, Unit = "pcs" },
            new() { BusinessId = businessId, Name = "Colgate MaxFresh Spicy Fresh Toothpaste (150g)", Sku = "PC-COLG-150", Barcode = "8901030000211", Category = "Personal Care", Brand = "Colgate", PurchasePrice = 90, SellingPrice = 115, GstPercentage = 18, CurrentQuantity = 30, MinimumStockLevel = 10, SupplierId = supHul, Unit = "pcs" },
            new() { BusinessId = businessId, Name = "Head & Shoulders Anti-Dandruff Shampoo (180ml)", Sku = "PC-HNS-180", Barcode = "8901030000222", Category = "Personal Care", Brand = "P&G", PurchasePrice = 145, SellingPrice = 180, GstPercentage = 18, CurrentQuantity = 18, MinimumStockLevel = 6, SupplierId = supHul, Unit = "btl" },

            // Household Cleaning
            new() { BusinessId = businessId, Name = "Surf Excel Easy Wash Detergent Powder (1kg)", Sku = "HC-SURF-1K", Barcode = "8901030000233", Category = "Household", Brand = "Surf Excel", PurchasePrice = 118, SellingPrice = 145, GstPercentage = 18, CurrentQuantity = 35, MinimumStockLevel = 12, SupplierId = supHul, Unit = "pkt" },
            new() { BusinessId = businessId, Name = "Vim Dishwash Gel Lemon (500ml)", Sku = "HC-VIM-500", Barcode = "8901030000244", Category = "Household", Brand = "Vim", PurchasePrice = 95, SellingPrice = 120, GstPercentage = 18, CurrentQuantity = 22, MinimumStockLevel = 8, SupplierId = supHul, Unit = "btl" },
            new() { BusinessId = businessId, Name = "Lizol Disinfectant Floor Cleaner Citrus (1L)", Sku = "HC-LIZO-1L", Barcode = "8901030000255", Category = "Household", Brand = "Lizol", PurchasePrice = 160, SellingPrice = 199, GstPercentage = 18, CurrentQuantity = 15, MinimumStockLevel = 6, SupplierId = supHul, Unit = "btl" }
        };

        await _db.Products.InsertManyAsync(products);
        _logger.LogInformation("Seeded {Count} products for {BusinessId}", products.Count, businessId);

        // 3. Seed Customers
        var customers = new List<Customer>
        {
            new() { BusinessId = businessId, Name = "Priya Patel", Mobile = "9810112233", Email = "priya.patel@gmail.com", Address = "Flat 402, Royal Palms, Sector 18, Noida", TotalPurchases = 4250, TotalPaid = 4250, PendingAmount = 0 },
            new() { BusinessId = businessId, Name = "Amit Verma", Mobile = "9820223344", Email = "amit.v@outlook.com", Address = "B-12, Green Park, Noida", TotalPurchases = 6800, TotalPaid = 5500, PendingAmount = 1300 },
            new() { BusinessId = businessId, Name = "Sunita Gupta", Mobile = "9830334455", Email = "sunita.g@gmail.com", Address = "House #88, Sector 15, Noida", TotalPurchases = 3100, TotalPaid = 3100, PendingAmount = 0 },
            new() { BusinessId = businessId, Name = "Rajesh Malhotra", Mobile = "9840445566", Email = "rajesh.malhotra@yahoo.com", Address = "C-501, Stellar Kings, Sector 19, Noida", TotalPurchases = 8900, TotalPaid = 7000, PendingAmount = 1900 },
            new() { BusinessId = businessId, Name = "Anjali Singh", Mobile = "9850556677", Email = "anjali.singh@gmail.com", Address = "Tower 3, Supertech Capetown, Noida", TotalPurchases = 5400, TotalPaid = 5400, PendingAmount = 0 }
        };
        await _db.Customers.InsertManyAsync(customers);

        // 4. Seed Historical Purchases & Sales for last 30 days
        var random = new Random(42);
        var now = DateTime.UtcNow;

        var salesList = new List<Sale>();
        var purchasesList = new List<Purchase>();
        var transactions = new List<InventoryTransaction>();

        // Generate 4 weekly purchases
        for (int w = 0; w < 4; w++)
        {
            var pDate = now.AddDays(-(28 - (w * 7) + random.Next(1, 3)));
            var pItems = new List<PurchaseItem>();
            decimal pSub = 0;
            decimal pGst = 0;

            foreach (var prod in products.Take(8))
            {
                int q = random.Next(10, 30);
                decimal baseCost = q * prod.PurchasePrice;
                decimal gstAmt = baseCost * (prod.GstPercentage / 100m);
                pSub += baseCost;
                pGst += gstAmt;

                pItems.Add(new PurchaseItem
                {
                    ProductId = prod.Id,
                    ProductName = prod.Name,
                    Quantity = q,
                    PurchasePrice = prod.PurchasePrice,
                    GstPercent = prod.GstPercentage,
                    DiscountPercent = 0,
                    TotalAmount = Math.Round(baseCost + gstAmt, 2)
                });
            }

            var grand = Math.Round(pSub + pGst, 2);
            var purchaseRecord = new Purchase
            {
                BusinessId = businessId,
                SupplierId = supHul,
                SupplierName = "Hindustan Unilever Depot",
                InvoiceNumber = $"PO-{pDate:yyyyMMdd}-000{w + 1}",
                PurchaseDate = pDate,
                Items = pItems,
                Subtotal = Math.Round(pSub, 2),
                DiscountTotal = 0,
                GstTotal = Math.Round(pGst, 2),
                GrandTotal = grand,
                PaidAmount = grand,
                PendingAmount = 0,
                PaymentStatus = "Paid",
                CreatedAt = pDate
            };
            purchasesList.Add(purchaseRecord);

            foreach (var it in pItems)
            {
                transactions.Add(new InventoryTransaction
                {
                    BusinessId = businessId,
                    ProductId = it.ProductId,
                    Type = InventoryTransactionType.Purchase,
                    Quantity = it.Quantity,
                    PreviousQuantity = 10,
                    NewQuantity = 10 + it.Quantity,
                    ReferenceType = "Purchase",
                    ReferenceId = purchaseRecord.Id,
                    Date = pDate
                });
            }
        }
        await _db.Purchases.InsertManyAsync(purchasesList);

        // Generate ~40 realistic sales distributed across last 30 days
        int invoiceSeq = 1;
        for (int d = 29; d >= 0; d--)
        {
            int salesToday = (d == 0) ? random.Next(3, 6) : random.Next(1, 3);
            for (int s = 0; s < salesToday; s++)
            {
                var sDate = now.AddDays(-d).AddHours(random.Next(9, 21)).AddMinutes(random.Next(0, 59));
                var customer = (random.Next(10) > 4) ? customers[random.Next(customers.Count)] : null;
                var custName = customer?.Name ?? "Walk-in Customer";
                var custId = customer?.Id;

                var chosenProds = products.OrderBy(_ => random.Next()).Take(random.Next(1, 5)).ToList();
                var sItems = new List<SaleItem>();
                decimal sSub = 0;
                decimal sGst = 0;

                foreach (var cp in chosenProds)
                {
                    int q = random.Next(1, 4);
                    decimal basePrice = q * cp.SellingPrice;
                    decimal gst = basePrice * (cp.GstPercentage / 100m);
                    sSub += basePrice;
                    sGst += gst;

                    sItems.Add(new SaleItem
                    {
                        ProductId = cp.Id,
                        ProductName = cp.Name,
                        Sku = cp.Sku,
                        Quantity = q,
                        UnitPrice = cp.SellingPrice,
                        DiscountPercent = 0,
                        GstPercent = cp.GstPercentage,
                        TotalAmount = Math.Round(basePrice + gst, 2)
                    });
                }

                var grand = Math.Round(sSub + sGst, 2);
                var paymentMethods = new[] { "Cash", "UPI", "UPI", "Card", "Cash" };
                var payMethod = paymentMethods[random.Next(paymentMethods.Length)];

                var saleRecord = new Sale
                {
                    BusinessId = businessId,
                    InvoiceNumber = $"INV-{sDate:yyyyMMdd}-{invoiceSeq:D4}",
                    CustomerId = custId,
                    CustomerName = custName,
                    Items = sItems,
                    Subtotal = Math.Round(sSub, 2),
                    DiscountTotal = 0,
                    GstTotal = Math.Round(sGst, 2),
                    GrandTotal = grand,
                    PaidAmount = grand,
                    PendingAmount = 0,
                    PaymentMethod = payMethod,
                    PaymentStatus = "Paid",
                    CreatedAt = sDate
                };
                salesList.Add(saleRecord);
                invoiceSeq++;

                foreach (var si in sItems)
                {
                    transactions.Add(new InventoryTransaction
                    {
                        BusinessId = businessId,
                        ProductId = si.ProductId,
                        Type = InventoryTransactionType.Sale,
                        Quantity = -si.Quantity,
                        PreviousQuantity = 20,
                        NewQuantity = 20 - si.Quantity,
                        ReferenceType = "Sale",
                        ReferenceId = saleRecord.Id,
                        Date = sDate
                    });
                }
            }
        }
        await _db.Sales.InsertManyAsync(salesList);
        await _db.InventoryTransactions.InsertManyAsync(transactions);

        _logger.LogInformation("Seeded {SalesCount} sales and {PurchasesCount} purchases for {BusinessId}",
            salesList.Count, purchasesList.Count, businessId);
    }

    private async Task SeedFestivalsAsync()
    {
        var count = await _db.FestivalEvents.CountDocumentsAsync(_ => true);
        if (count > 0) return;

        var now = DateTime.UtcNow;

        var festivals = new List<FestivalEvent>
        {
            new()
            {
                Name = "Diwali (Festival of Lights)",
                StartDate = now.AddDays(42),
                EndDate = now.AddDays(47),
                Region = "India",
                RelevantCategories = new() { "Snacks", "Beverages", "Groceries", "Dairy" },
                DemandMultiplier = 2.0,
                Description = "Major festival with massive surge in sweets, snacks, ghee, dry fruits, and beverages demand."
            },
            new()
            {
                Name = "Navratri & Dussehra",
                StartDate = now.AddDays(22),
                EndDate = now.AddDays(31),
                Region = "India",
                RelevantCategories = new() { "Groceries", "Dairy", "Beverages" },
                DemandMultiplier = 1.6,
                Description = "Fasting ingredients, dairy products, tea, and special flours surge by 60%."
            },
            new()
            {
                Name = "Ganesh Chaturthi",
                StartDate = now.AddDays(10),
                EndDate = now.AddDays(14),
                Region = "India",
                RelevantCategories = new() { "Groceries", "Dairy", "Snacks" },
                DemandMultiplier = 1.5,
                Description = "Demand surge in sweets, flour, jaggery, milk, and festival confectioneries."
            },
            new()
            {
                Name = "Holi (Festival of Colours)",
                StartDate = now.AddDays(180),
                EndDate = now.AddDays(182),
                Region = "India",
                RelevantCategories = new() { "Beverages", "Snacks", "Groceries" },
                DemandMultiplier = 1.7,
                Description = "High surge in cold drinks, thandai, packaged snacks, and sweets."
            },
            new()
            {
                Name = "Eid-ul-Fitr",
                StartDate = now.AddDays(210),
                EndDate = now.AddDays(212),
                Region = "India",
                RelevantCategories = new() { "Groceries", "Dairy", "Beverages" },
                DemandMultiplier = 1.8,
                Description = "High demand for sewai, milk, sugar, dry fruits, and cooking oils."
            }
        };

        await _db.FestivalEvents.InsertManyAsync(festivals);
        _logger.LogInformation("Seeded {Count} Indian festival events", festivals.Count);
    }
}
