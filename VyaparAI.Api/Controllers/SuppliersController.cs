using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VyaparAI.Api.DTOs.Suppliers;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;

namespace VyaparAI.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/suppliers")]
public class SuppliersController : ControllerBase
{
    private readonly ISupplierService _supplierService;

    public SuppliersController(ISupplierService supplierService)
    {
        _supplierService = supplierService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<SupplierResponseDto>>>> GetSuppliers([FromQuery] SupplierQueryDto query)
    {
        var result = await _supplierService.GetSuppliersAsync(User.GetBusinessId(), query);
        return Ok(ApiResponse<PagedResult<SupplierResponseDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<SupplierResponseDto>>> GetById(string id)
    {
        var supplier = await _supplierService.GetByIdAsync(User.GetBusinessId(), id);
        return Ok(ApiResponse<SupplierResponseDto>.Ok(supplier));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SupplierResponseDto>>> Create([FromBody] CreateSupplierDto dto)
    {
        var supplier = await _supplierService.CreateAsync(User.GetBusinessId(), dto);
        return Ok(ApiResponse<SupplierResponseDto>.Ok(supplier, "Supplier created successfully."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<SupplierResponseDto>>> Update(string id, [FromBody] UpdateSupplierDto dto)
    {
        var supplier = await _supplierService.UpdateAsync(User.GetBusinessId(), id, dto);
        return Ok(ApiResponse<SupplierResponseDto>.Ok(supplier, "Supplier updated successfully."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(string id)
    {
        await _supplierService.DeleteAsync(User.GetBusinessId(), id);
        return Ok(ApiResponse<object>.Ok(new { }, "Supplier deleted successfully."));
    }
}
