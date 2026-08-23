namespace VyaparAI.Api.Helpers;

/// <summary>
/// Standard shape for every paginated list endpoint (Products, Customers,
/// Suppliers, Inventory, Transactions, ...) so the frontend can build one
/// reusable pagination component instead of a bespoke one per page.
/// </summary>
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);

    public static PagedResult<T> Create(List<T> items, long totalCount, int page, int pageSize) => new()
    {
        Items = items,
        TotalCount = (int)totalCount,
        Page = page,
        PageSize = pageSize
    };
}
