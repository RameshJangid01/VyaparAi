using VyaparAI.Api.DTOs.Products;
using VyaparAI.Api.Helpers;

namespace VyaparAI.Api.Interfaces;

public interface IProductService
{
    Task<PagedResult<ProductResponseDto>> GetProductsAsync(string businessId, ProductQueryDto query);
    Task<ProductResponseDto> GetByIdAsync(string businessId, string productId);
    Task<ProductResponseDto> CreateAsync(string businessId, CreateProductDto dto);
    Task<ProductResponseDto> UpdateAsync(string businessId, string productId, UpdateProductDto dto);
    Task DeleteAsync(string businessId, string productId);
    Task<List<string>> GetCategoriesAsync(string businessId);
}
