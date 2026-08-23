namespace VyaparAI.Api.DTOs.Common;

/// <summary>Base query parameters shared by every paginated/searchable list endpoint.</summary>
public class PagedQueryDto
{
    public string? Search { get; set; }

    private int _page = 1;
    public int Page
    {
        get => _page;
        set => _page = value < 1 ? 1 : value;
    }

    private int _pageSize = 20;
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value < 1 ? 1 : value > 100 ? 100 : value;
    }
}
