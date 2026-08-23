using Microsoft.AspNetCore.Mvc;
using VyaparAI.Api.Data;
using VyaparAI.Api.Helpers;

namespace VyaparAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly DataSeeder _seeder;

    public SeedController(DataSeeder seeder)
    {
        _seeder = seeder;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<string>>> SeedDatabase()
    {
        await _seeder.SeedAsync();
        return Ok(ApiResponse<string>.Ok("Database seeded successfully with realistic products, sales, customers, suppliers, and festival events.", "Seed successful"));
    }
}
