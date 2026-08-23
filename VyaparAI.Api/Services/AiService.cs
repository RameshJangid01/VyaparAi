using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using VyaparAI.Api.Configuration;
using VyaparAI.Api.Data;
using VyaparAI.Api.DTOs.AI;
using VyaparAI.Api.Interfaces;

namespace VyaparAI.Api.Services;

public class AiService : IAiService
{
    private readonly MongoDbContext _db;
    private readonly BusinessContextBuilder _contextBuilder;
    private readonly DemandForecastService _forecastService;
    private readonly AiSettings _settings;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AiService> _logger;

    public AiService(
        MongoDbContext db,
        BusinessContextBuilder contextBuilder,
        DemandForecastService forecastService,
        IOptions<AiSettings> settings,
        IHttpClientFactory httpClientFactory,
        ILogger<AiService> logger)
    {
        _db = db;
        _contextBuilder = contextBuilder;
        _forecastService = forecastService;
        _settings = settings.Value;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<AiChatResponseDto> AskCopilotAsync(string businessId, string message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return new AiChatResponseDto { Response = "Please ask a question about your business, sales, inventory, or festival demand." };

        var snapshot = await _contextBuilder.BuildSnapshotAsync(businessId);
        var forecast = await _forecastService.CalculateForecastAsync(businessId);

        // Detect budget inquiry (e.g. "30000", "₹30,000", "50,000", "30k", "50k")
        decimal? budget = ExtractBudget(message);
        List<PurchasePlanItemDto>? recommendedPlan = null;
        decimal? estimatedCost = null;
        decimal? budgetRemaining = null;

        if (budget.HasValue && budget.Value > 0)
        {
            var planResult = await GeneratePurchasePlanAsync(businessId, new PurchasePlanRequestDto { Budget = budget.Value });
            recommendedPlan = planResult.Items;
            estimatedCost = planResult.TotalEstimatedCost;
            budgetRemaining = planResult.BudgetRemaining;
        }

        // Try Gemini API if key is present
        string? geminiResponse = null;
        if (!string.IsNullOrWhiteSpace(_settings.GeminiApiKey))
        {
            geminiResponse = await CallGeminiAsync(message, snapshot, forecast, budget, recommendedPlan, estimatedCost, budgetRemaining);
        }

        // If Gemini is not configured or failed, use deterministic multi-lingual reasoning engine
        var finalResponse = !string.IsNullOrWhiteSpace(geminiResponse)
            ? geminiResponse
            : GenerateDeterministicAnswer(message, snapshot, forecast, budget, recommendedPlan, estimatedCost, budgetRemaining);

        var lang = DetectLanguage(message);

        return new AiChatResponseDto
        {
            Response = finalResponse,
            Language = lang,
            RecommendedPurchasePlan = recommendedPlan,
            EstimatedPurchaseCost = estimatedCost,
            RemainingBudget = budgetRemaining,
            SuggestedFollowUps = GenerateSuggestedFollowUps(message, snapshot)
        };
    }

    public async Task<List<AiInsightDto>> GetInsightsAsync(string businessId)
    {
        var snapshot = await _contextBuilder.BuildSnapshotAsync(businessId);
        var forecast = await _forecastService.CalculateForecastAsync(businessId);
        var insights = new List<AiInsightDto>();

        // Stock alert
        if (snapshot.LowStockProducts.Count > 0)
        {
            var names = string.Join(", ", snapshot.LowStockProducts.Take(3).Select(p => p.Name));
            insights.Add(new AiInsightDto
            {
                Id = "insight-lowstock",
                Title = "Low Stock Alert",
                Description = $"{snapshot.LowStockProducts.Count} products are below safe reorder levels: {names}{(snapshot.LowStockProducts.Count > 3 ? "..." : "")}.",
                Category = "Inventory",
                Severity = "warning",
                ActionText = "Reorder Now",
                ActionLink = "/purchases",
                CreatedAt = DateTime.UtcNow
            });
        }

        // Festival preparation
        if (snapshot.UpcomingFestival != null)
        {
            var fest = snapshot.UpcomingFestival;
            var cats = string.Join(", ", fest.RelevantCategories);
            insights.Add(new AiInsightDto
            {
                Id = "insight-festival",
                Title = $"{fest.Name} Demand Forecast (+{(int)((fest.DemandMultiplier - 1) * 100)}%)",
                Description = $"{fest.Name} is coming up in {snapshot.DaysToFestival} days! Expect high demand in {cats}. Ensure extra inventory buffer.",
                Category = "Festival",
                Severity = "success",
                ActionText = "View AI Forecast",
                ActionLink = "/ai",
                CreatedAt = DateTime.UtcNow
            });
        }

        // Top seller
        if (snapshot.TopSellingProducts.Count > 0)
        {
            var top = snapshot.TopSellingProducts[0];
            insights.Add(new AiInsightDto
            {
                Id = "insight-topseller",
                Title = $"Top Revenue Driver: {top.Name}",
                Description = $"Generated ₹{top.Revenue:N0} across {top.UnitsSold} units sold this month. Ensure stock never runs out.",
                Category = "Sales",
                Severity = "info",
                ActionText = "View Product",
                ActionLink = "/inventory",
                CreatedAt = DateTime.UtcNow
            });
        }

        // Customer outstanding
        if (snapshot.CustomerPendingReceivables > 0)
        {
            insights.Add(new AiInsightDto
            {
                Id = "insight-receivables",
                Title = "Outstanding Credit Balances",
                Description = $"Total ₹{snapshot.CustomerPendingReceivables:N0} is currently pending from credit customers.",
                Category = "Sales",
                Severity = "warning",
                ActionText = "View Customers",
                ActionLink = "/customers",
                CreatedAt = DateTime.UtcNow
            });
        }

        return insights;
    }

    public async Task<ForecastResponseDto> GetDemandForecastAsync(string businessId)
    {
        return await _forecastService.CalculateForecastAsync(businessId);
    }

    public async Task<PurchasePlanResponseDto> GeneratePurchasePlanAsync(string businessId, PurchasePlanRequestDto request)
    {
        var snapshot = await _contextBuilder.BuildSnapshotAsync(businessId);
        var forecast = await _forecastService.CalculateForecastAsync(businessId);

        decimal totalBudget = request.Budget;
        decimal spent = 0;
        var planItems = new List<PurchasePlanItemDto>();

        var products = await _db.Products
            .Find(p => p.BusinessId == businessId && p.IsActive)
            .ToListAsync();

        var suppliers = await _db.Suppliers
            .Find(s => s.BusinessId == businessId)
            .ToListAsync();

        var supplierMap = suppliers.ToDictionary(s => s.Id, s => s.SupplierName);
        var forecastMap = forecast.Forecasts.ToDictionary(f => f.ProductId);

        // Priority 1: Out of Stock and Low Stock items
        var urgentProducts = products
            .Where(p => p.CurrentQuantity <= p.MinimumStockLevel)
            .OrderBy(p => p.CurrentQuantity)
            .ToList();

        foreach (var p in urgentProducts)
        {
            if (spent >= totalBudget) break;

            forecastMap.TryGetValue(p.Id, out var fc);
            int needed = fc?.RecommendedReorderQuantity ?? Math.Max(10, (p.MinimumStockLevel * 2) - p.CurrentQuantity);
            if (needed <= 0) needed = 10;

            decimal cost = needed * p.PurchasePrice;
            if (spent + cost > totalBudget && p.PurchasePrice > 0)
            {
                needed = (int)Math.Floor((totalBudget - spent) / p.PurchasePrice);
                cost = needed * p.PurchasePrice;
            }

            if (needed > 0)
            {
                spent += cost;
                planItems.Add(new PurchasePlanItemDto
                {
                    ProductId = p.Id,
                    ProductName = p.Name,
                    Category = p.Category,
                    SupplierId = p.SupplierId,
                    SupplierName = p.SupplierId != null && supplierMap.TryGetValue(p.SupplierId, out var sn) ? sn : null,
                    CurrentStock = p.CurrentQuantity,
                    SuggestedQuantity = needed,
                    UnitPurchasePrice = p.PurchasePrice,
                    TotalCost = Math.Round(cost, 2),
                    Reason = p.CurrentQuantity <= 0 ? "Critically out of stock - urgent restock" : "Stock below safety threshold",
                    ConfidencePercent = 95,
                    ProductLink = "/products"
                });
            }
        }

        // Priority 2: Upcoming Festival relevant items
        if (spent < totalBudget && snapshot.UpcomingFestival != null)
        {
            var festCats = snapshot.UpcomingFestival.RelevantCategories;
            var festProducts = products
                .Where(p => !planItems.Any(pi => pi.ProductId == p.Id) &&
                            festCats.Any(c => string.Equals(c, p.Category, StringComparison.OrdinalIgnoreCase)))
                .ToList();

            foreach (var p in festProducts)
            {
                if (spent >= totalBudget) break;

                forecastMap.TryGetValue(p.Id, out var fc);
                int needed = fc?.RecommendedReorderQuantity ?? 15;
                if (needed <= 0) needed = 15;

                decimal cost = needed * p.PurchasePrice;
                if (spent + cost > totalBudget && p.PurchasePrice > 0)
                {
                    needed = (int)Math.Floor((totalBudget - spent) / p.PurchasePrice);
                    cost = needed * p.PurchasePrice;
                }

                if (needed > 0)
                {
                    spent += cost;
                    planItems.Add(new PurchasePlanItemDto
                    {
                        ProductId = p.Id,
                        ProductName = p.Name,
                        Category = p.Category,
                        SupplierId = p.SupplierId,
                        SupplierName = p.SupplierId != null && supplierMap.TryGetValue(p.SupplierId, out var sn) ? sn : null,
                        CurrentStock = p.CurrentQuantity,
                        SuggestedQuantity = needed,
                        UnitPurchasePrice = p.PurchasePrice,
                        TotalCost = Math.Round(cost, 2),
                        Reason = $"{snapshot.UpcomingFestival.Name} demand surge ({snapshot.UpcomingFestival.DemandMultiplier}x multiplier)",
                        ConfidencePercent = 92,
                        ProductLink = "/products"
                    });
                }
            }
        }

        // Priority 3: Fast moving top sellers
        if (spent < totalBudget)
        {
            var topProducts = snapshot.TopSellingProducts
                .Where(tp => !planItems.Any(pi => pi.ProductId == tp.ProductId))
                .ToList();

            foreach (var tp in topProducts)
            {
                if (spent >= totalBudget) break;

                int needed = Math.Max(10, tp.UnitsSold / 2);
                decimal cost = needed * tp.PurchasePrice;
                if (spent + cost > totalBudget && tp.PurchasePrice > 0)
                {
                    needed = (int)Math.Floor((totalBudget - spent) / tp.PurchasePrice);
                    cost = needed * tp.PurchasePrice;
                }

                if (needed > 0)
                {
                    spent += cost;
                    planItems.Add(new PurchasePlanItemDto
                    {
                        ProductId = tp.ProductId,
                        ProductName = tp.Name,
                        Category = tp.Category,
                        CurrentStock = tp.CurrentStock,
                        SuggestedQuantity = needed,
                        UnitPurchasePrice = tp.PurchasePrice,
                        TotalCost = Math.Round(cost, 2),
                        Reason = "High velocity sales momentum (Top Seller)",
                        ConfidencePercent = 88,
                        ProductLink = "/products"
                    });
                }
            }
        }

        decimal remaining = Math.Max(0, totalBudget - spent);

        var summary = $"Generated an optimized purchase plan allocating ₹{spent:N0} across {planItems.Count} high-demand products, leaving ₹{remaining:N0} buffer from your ₹{totalBudget:N0} budget.";

        return new PurchasePlanResponseDto
        {
            BudgetAllocated = totalBudget,
            TotalEstimatedCost = Math.Round(spent, 2),
            BudgetRemaining = Math.Round(remaining, 2),
            TotalItemsCount = planItems.Count,
            Items = planItems,
            Summary = summary
        };
    }

    private async Task<string?> CallGeminiAsync(
        string userMessage,
        BusinessContextSnapshot snapshot,
        ForecastResponseDto forecast,
        decimal? budget,
        List<PurchasePlanItemDto>? recommendedPlan,
        decimal? estimatedCost,
        decimal? budgetRemaining)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            var model = string.IsNullOrWhiteSpace(_settings.GeminiModel) ? "gemini-2.0-flash" : _settings.GeminiModel;
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={_settings.GeminiApiKey}";

            // If the user mentioned a budget, a purchase plan was already computed
            // deterministically. Describe it here so Gemini's narration matches
            // the table the frontend renders below the chat bubble, instead of
            // Gemini guessing or contradicting it.
            var purchasePlanContext = "Not applicable - user did not mention a budget in this message.";
            if (budget.HasValue && recommendedPlan != null)
            {
                var itemLines = string.Join("\n", recommendedPlan.Select(i =>
                    $"  - {i.ProductName} ({i.Category}): buy {i.SuggestedQuantity} units @ ₹{i.UnitPurchasePrice:N0} each = ₹{i.TotalCost:N0}. Reason: {i.Reason}"));

                purchasePlanContext = $@"The user mentioned a budget of ₹{budget:N0}. A purchase plan has ALREADY been generated deterministically - do not invent a different one, just explain this one in your own words:
- Total estimated cost: ₹{estimatedCost:N0}
- Remaining budget after purchase: ₹{budgetRemaining:N0}
- Recommended items ({recommendedPlan.Count}):
{itemLines}";
            }

            var systemPrompt = $@"You are VyaparAI, an intelligent retail business copilot for Indian retail shopkeepers.
You are helping the store '{snapshot.BusinessName}'.

STRICT RULES:
1. Always base all numbers strictly on the deterministic business context provided below. NEVER invent sales, stock, or purchase-plan numbers of your own.
2. Answer in the same language as the user: English, Hindi, or conversational Hinglish (e.g. 'Aaj ki total sale ₹{snapshot.TodaySales:N0} hui hai').
3. Keep answers concise, actionable, and clear with bullet points where appropriate. Aim for under 120 words unless the user explicitly asks for more detail.
4. If a purchase plan is provided below, summarize it narratively (do not repeat every line item verbatim, the exact table is already shown separately to the user) and reference the same totals.

REAL BUSINESS DATA:
- Today's Sales: ₹{snapshot.TodaySales:N0} across {snapshot.TodayOrders} orders (Profit: ₹{snapshot.TodayProfit:N0})
- This Month's Sales: ₹{snapshot.MonthSales:N0} across {snapshot.MonthOrders} orders (Profit: ₹{snapshot.MonthProfit:N0})
- Total Active Products: {snapshot.TotalProductsCount} (Stock Value: ₹{snapshot.TotalInventoryValue:N0})
- Low Stock Items ({snapshot.LowStockCount}): {string.Join(", ", snapshot.LowStockProducts.Take(5).Select(p => $"{p.Name} (Stock: {p.CurrentStock}, Min: {p.MinimumStock})"))}
- Top Selling Products: {string.Join(", ", snapshot.TopSellingProducts.Take(4).Select(p => $"{p.Name} ({p.UnitsSold} sold, ₹{p.Revenue:N0} rev)"))}
- Slow Moving Products: {string.Join(", ", snapshot.SlowMovingProducts.Take(4).Select(p => $"{p.Name} (Stock: {p.CurrentStock})"))}
- Customer Pending Balance: ₹{snapshot.CustomerPendingReceivables:N0}
- Upcoming Festival: {(snapshot.UpcomingFestival != null ? $"{snapshot.UpcomingFestival.Name} in {snapshot.DaysToFestival} days (Demand Multiplier: {snapshot.UpcomingFestival.DemandMultiplier}x, Categories: {string.Join(", ", snapshot.UpcomingFestival.RelevantCategories)})" : "None")}

PURCHASE PLAN CONTEXT:
{purchasePlanContext}
";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = systemPrompt },
                            new { text = $"User Query: {userMessage}" }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.3,
                    maxOutputTokens = 4096
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var response = await client.PostAsync(url, content);

            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Gemini API call returned status {StatusCode}: {Error}", response.StatusCode, errorText);
                return null;
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);
            var root = doc.RootElement;

            if (root.TryGetProperty("candidates", out var candidates) &&
                candidates.GetArrayLength() > 0 &&
                candidates[0].TryGetProperty("content", out var contentElem) &&
                contentElem.TryGetProperty("parts", out var parts) &&
                parts.GetArrayLength() > 0 &&
                parts[0].TryGetProperty("text", out var textElem))
            {
                return textElem.GetString();
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Gemini API for copilot query");
            return null;
        }
    }

    private string GenerateDeterministicAnswer(
        string message,
        BusinessContextSnapshot snap,
        ForecastResponseDto forecast,
        decimal? budget,
        List<PurchasePlanItemDto>? plan,
        decimal? estimatedCost,
        decimal? budgetRemaining)
    {
        var lower = message.ToLowerInvariant();
        bool isHindi = lower.Contains("aaj") || lower.Contains("bik") || lower.Contains("kya") ||
                       lower.Contains("kitni") || lower.Contains("kitna") || lower.Contains("kaunsa") ||
                       lower.Contains("karu") || lower.Contains("chahiye") || lower.Contains("dikhao") ||
                       lower.Contains("paas") || lower.Contains("sale");

        // 1. Budget Purchase Plan inquiry
        if (budget.HasValue && budget.Value > 0)
        {
            if (isHindi)
            {
                var festMsg = snap.UpcomingFestival != null ? $" {snap.UpcomingFestival.Name} ke demand surge ko dhyan me rakhte hue," : "";
                return $"Aapke ₹{budget.Value:N0} budget ke hisaab se,{festMsg} maine ek optimized Purchase Plan ready kiya hai.\n\n" +
                       $"• **Total Estimated Cost:** ₹{estimatedCost:N0}\n" +
                       $"• **Remaining Budget:** ₹{budgetRemaining:N0}\n" +
                       $"• **Total Products to Reorder:** {plan?.Count ?? 0} items\n\n" +
                       "Niche diye gaye table me recommended items aur quantities check karke **'Generate Purchase Plan'** button par click karein.";
            }
            else
            {
                return $"Based on your ₹{budget.Value:N0} budget and current sales velocity, here is your optimized purchase plan:\n\n" +
                       $"• **Total Estimated Cost:** ₹{estimatedCost:N0}\n" +
                       $"• **Remaining Buffer:** ₹{budgetRemaining:N0}\n" +
                       $"• **Recommended Items:** {plan?.Count ?? 0} products\n\n" +
                       "Review the itemized recommendations in the table below and click **'Generate Purchase Plan'** to proceed.";
            }
        }

        // 2. Today's sales inquiry
        if (lower.Contains("today") || lower.Contains("aaj") || lower.Contains("daily"))
        {
            if (isHindi)
            {
                return $"**Aaj ki Business Summary:**\n\n" +
                       $"• **Aaj ki Total Sale:** ₹{snap.TodaySales:N0}\n" +
                       $"• **Total Orders:** {snap.TodayOrders}\n" +
                       $"• **Estimated Profit:** ₹{snap.TodayProfit:N0}\n" +
                       $"• **Monthly Revenue Till Date:** ₹{snap.MonthSales:N0} ({snap.MonthOrders} orders)";
            }
            else
            {
                return $"**Today's Business Summary:**\n\n" +
                       $"• **Today's Total Sales:** ₹{snap.TodaySales:N0}\n" +
                       $"• **Total Orders Today:** {snap.TodayOrders}\n" +
                       $"• **Estimated Today's Profit:** ₹{snap.TodayProfit:N0}\n" +
                       $"• **Current Month Revenue:** ₹{snap.MonthSales:N0}";
            }
        }

        // 3. Top selling / Fast moving inquiry
        if (lower.Contains("top") || lower.Contains("jyada") || lower.Contains("fast") || lower.Contains("best"))
        {
            var topList = string.Join("\n", snap.TopSellingProducts.Take(5).Select((p, i) => $"{i + 1}. **{p.Name}** — {p.UnitsSold} units sold (₹{p.Revenue:N0} revenue, Stock: {p.CurrentStock})"));
            if (isHindi)
            {
                return $"**Sabse Jyada Bikne Wale Products (Top Sellers):**\n\n{topList}\n\n" +
                       "💡 *Tip: In fast-moving products ka stock kabhi zero na hone dein.*";
            }
            else
            {
                return $"**Top Selling Products This Month:**\n\n{topList}\n\n" +
                       "💡 *Recommendation: Keep higher buffer inventory for these fast runners.*";
            }
        }

        // 4. Low stock inquiry
        if (lower.Contains("low") || lower.Contains("stock") || lower.Contains("khali") || lower.Contains("reorder"))
        {
            if (snap.LowStockProducts.Count == 0)
            {
                return isHindi
                    ? "Badhai ho! Aapke kisi bhi product ka stock low nahi hai. Sabhi items safe stock level par hain."
                    : "Great news! All products in your inventory are currently above minimum safety thresholds.";
            }

            var lowList = string.Join("\n", snap.LowStockProducts.Take(6).Select(p => $"• **{p.Name}** — Stock: **{p.CurrentStock}** (Min Level: {p.MinimumStock}, Cost: ₹{p.PurchasePrice})"));
            if (isHindi)
            {
                return $"⚠️ **{snap.LowStockProducts.Count} Products Low Stock me hain:**\n\n{lowList}\n\n" +
                       "Inhe turant restock karne ke liye Purchases section me jayein.";
            }
            else
            {
                return $"⚠️ **{snap.LowStockProducts.Count} Products are running low on stock:**\n\n{lowList}\n\n" +
                       "Consider creating a Purchase Order to avoid stockouts.";
            }
        }

        // 5. Profit inquiry
        if (lower.Contains("profit") || lower.Contains("margin") || lower.Contains("kamai"))
        {
            var margin = snap.MonthSales > 0 ? (snap.MonthProfit / snap.MonthSales) * 100 : 0;
            if (isHindi)
            {
                return $"**Aapki Profitability Overview:**\n\n" +
                       $"• **Aaj ka Estimated Gross Profit:** ₹{snap.TodayProfit:N0}\n" +
                       $"• **Is Mahine ka Estimated Profit:** ₹{snap.MonthProfit:N0}\n" +
                       $"• **Estimated Profit Margin:** {margin:F1}%\n" +
                       $"• **Total Stock Valuation:** ₹{snap.TotalInventoryValue:N0}";
            }
            else
            {
                return $"**Profitability Overview:**\n\n" +
                       $"• **Today's Gross Profit:** ₹{snap.TodayProfit:N0}\n" +
                       $"• **Month-to-Date Gross Profit:** ₹{snap.MonthProfit:N0}\n" +
                       $"• **Estimated Gross Margin:** {margin:F1}%\n" +
                       $"• **Total Stock Asset Value:** ₹{snap.TotalInventoryValue:N0}";
            }
        }

        // 6. Festival inquiry
        if (lower.Contains("festival") || lower.Contains("diwali") || lower.Contains("holi") || lower.Contains("eid") || lower.Contains("tyohar"))
        {
            if (snap.UpcomingFestival != null)
            {
                var f = snap.UpcomingFestival;
                var cats = string.Join(", ", f.RelevantCategories);
                if (isHindi)
                {
                    return $"🎉 **Upcoming Festival: {f.Name}**\n\n" +
                           $"• **Bache hue din:** {snap.DaysToFestival} days\n" +
                           $"• **Expected Demand Surge:** {f.DemandMultiplier}x (+{(int)((f.DemandMultiplier - 1) * 100)}%)\n" +
                           $"• **High-Demand Categories:** {cats}\n\n" +
                           $"In categories ke products ka extra stock rakhein taaki festival season me full demand fulfill ho sake.";
                }
                else
                {
                    return $"🎉 **Upcoming Festival Intelligence: {f.Name}**\n\n" +
                           $"• **Days Remaining:** {snap.DaysToFestival} days\n" +
                           $"• **Demand Surge Multiplier:** {f.DemandMultiplier}x (+{(int)((f.DemandMultiplier - 1) * 100)}%)\n" +
                           $"• **Target Categories:** {cats}\n\n" +
                           $"Recommendation: Increase stock orders for these categories by {(int)((f.DemandMultiplier - 1) * 100)}% ahead of time.";
                }
            }
            else
            {
                return isHindi
                    ? "Agle 30 dino me koi major festival configured nahi hai. Regular run rate ke hisaab se inventory maintain karein."
                    : "No major festival is scheduled in the next 30 days. Maintain regular reorder schedules.";
            }
        }

        // 7. Slow moving inquiry
        if (lower.Contains("slow") || lower.Contains("dead") || lower.Contains("kam") || lower.Contains("ruk"))
        {
            var slowList = string.Join("\n", snap.SlowMovingProducts.Take(5).Select(p => $"• **{p.Name}** — Stock: {p.CurrentStock}, 30 Din me sirf {p.UnitsSold} bike"));
            if (isHindi)
            {
                return $"📦 **Slow-Moving Products:**\n\n{slowList}\n\n" +
                       "💡 *Tip: In products par discount ya combo offers dekar inventory clear karein.*";
            }
            else
            {
                return $"📦 **Slow-Moving Inventory:**\n\n{slowList}\n\n" +
                       "💡 *Tip: Consider bundled offers or promotional discounts to liquidate stagnant stock.*";
            }
        }

        // Default response
        if (isHindi)
        {
            return $"Main VyaparAI hoon — aapka business copilot. Aap mujhse pooch sakte hain:\n\n" +
                   $"• *'Aaj ki sale kitni hui?'* (Today's sales)\n" +
                   $"• *'Low stock products dikhao'* (Inventory alerts)\n" +
                   $"• *'Sabse jyada kya bik raha hai?'* (Top sellers)\n" +
                   $"• *'Mere paas ₹30,000 hain, kya purchase karu?'* (AI purchase planner)\n" +
                   $"• *'Diwali ke liye kya stock karu?'* (Festival demand forecast)";
        }
        else
        {
            return $"I'm VyaparAI — your intelligent retail copilot. You can ask me:\n\n" +
                   $"• *'What are today's sales?'*\n" +
                   $"• *'Show low stock products'*\n" +
                   $"• *'What is selling the most?'*\n" +
                   $"• *'I have ₹30,000. What should I purchase?'*\n" +
                   $"• *'How should I prepare for upcoming festivals?'*";
        }
    }

    private static decimal? ExtractBudget(string text)
    {
        // Matches patterns like "₹30,000", "₹ 30000", "30000 rs", "30,000 rupees", "30k", "50000"
        var matchK = Regex.Match(text, @"(\d+)\s*k", RegexOptions.IgnoreCase);
        if (matchK.Success && int.TryParse(matchK.Groups[1].Value, out var kVal))
        {
            return kVal * 1000m;
        }

        var match = Regex.Match(text, @"(?:₹|rs\.?|inr|budget|rupees)?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,8})", RegexOptions.IgnoreCase);
        if (match.Success)
        {
            var raw = match.Groups[1].Value.Replace(",", "");
            if (decimal.TryParse(raw, out var val) && val >= 500)
            {
                return val;
            }
        }

        return null;
    }

    private static string DetectLanguage(string text)
    {
        var lower = text.ToLowerInvariant();
        if (lower.Contains("aaj") || lower.Contains("kitni") || lower.Contains("kya") || lower.Contains("karu") || lower.Contains("bik"))
            return "hinglish";
        return "en";
    }

    private static List<string> GenerateSuggestedFollowUps(string message, BusinessContextSnapshot snap)
    {
        var list = new List<string>();
        var lower = message.ToLowerInvariant();

        if (lower.Contains("sale") || lower.Contains("aaj"))
        {
            list.Add("Sabse jyada kya bik raha hai?");
            list.Add("Mera profit kitna hai?");
            list.Add("Low stock products dikhao");
        }
        else if (lower.Contains("stock") || lower.Contains("low"))
        {
            list.Add("Mere paas ₹30,000 hain, kya purchase karu?");
            list.Add("Agle 15 din me kya order karna chahiye?");
        }
        else
        {
            list.Add("Aaj ki sale kitni hui?");
            list.Add("Mere paas ₹50,000 hain, kya purchase karu?");
            if (snap.UpcomingFestival != null)
                list.Add($"{snap.UpcomingFestival.Name} ke liye kya stock karu?");
        }

        return list;
    }
}