using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VyaparAI.Api.DTOs.Products;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;

namespace VyaparAI.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    /// <summary>Searchable, filterable, paginated product list for the caller's business.</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ProductResponseDto>>>> GetProducts([FromQuery] ProductQueryDto query)
    {
        var result = await _productService.GetProductsAsync(User.GetBusinessId(), query);
        return Ok(ApiResponse<PagedResult<ProductResponseDto>>.Ok(result));
    }

    [HttpGet("categories")]
    public async Task<ActionResult<ApiResponse<List<string>>>> GetCategories()
    {
        var categories = await _productService.GetCategoriesAsync(User.GetBusinessId());
        return Ok(ApiResponse<List<string>>.Ok(categories));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ProductResponseDto>>> GetById(string id)
    {
        var product = await _productService.GetByIdAsync(User.GetBusinessId(), id);
        return Ok(ApiResponse<ProductResponseDto>.Ok(product));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ProductResponseDto>>> Create([FromBody] CreateProductDto dto)
    {
        var product = await _productService.CreateAsync(User.GetBusinessId(), dto);
        return Ok(ApiResponse<ProductResponseDto>.Ok(product, "Product created successfully."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ProductResponseDto>>> Update(string id, [FromBody] UpdateProductDto dto)
    {
        var product = await _productService.UpdateAsync(User.GetBusinessId(), id, dto);
        return Ok(ApiResponse<ProductResponseDto>.Ok(product, "Product updated successfully."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(string id)
    {
        await _productService.DeleteAsync(User.GetBusinessId(), id);
        return Ok(ApiResponse<object>.Ok(new { }, "Product deleted successfully."));
    }
}
