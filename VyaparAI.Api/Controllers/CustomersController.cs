using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VyaparAI.Api.DTOs.Customers;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;

namespace VyaparAI.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/customers")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<CustomerResponseDto>>>> GetCustomers([FromQuery] CustomerQueryDto query)
    {
        var result = await _customerService.GetCustomersAsync(User.GetBusinessId(), query);
        return Ok(ApiResponse<PagedResult<CustomerResponseDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<CustomerResponseDto>>> GetById(string id)
    {
        var customer = await _customerService.GetByIdAsync(User.GetBusinessId(), id);
        return Ok(ApiResponse<CustomerResponseDto>.Ok(customer));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CustomerResponseDto>>> Create([FromBody] CreateCustomerDto dto)
    {
        var customer = await _customerService.CreateAsync(User.GetBusinessId(), dto);
        return Ok(ApiResponse<CustomerResponseDto>.Ok(customer, "Customer created successfully."));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<CustomerResponseDto>>> Update(string id, [FromBody] UpdateCustomerDto dto)
    {
        var customer = await _customerService.UpdateAsync(User.GetBusinessId(), id, dto);
        return Ok(ApiResponse<CustomerResponseDto>.Ok(customer, "Customer updated successfully."));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(string id)
    {
        await _customerService.DeleteAsync(User.GetBusinessId(), id);
        return Ok(ApiResponse<object>.Ok(new { }, "Customer deleted successfully."));
    }
}
