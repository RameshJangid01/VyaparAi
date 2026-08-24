using System.Text;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using VyaparAI.Api.Configuration;
using VyaparAI.Api.Data;
using VyaparAI.Api.Helpers;
using VyaparAI.Api.Interfaces;
using VyaparAI.Api.Middleware;
using VyaparAI.Api.Services;

// Load variables from a local .env file (if present) into the process environment.
// In real deployments these are set directly as environment variables instead.
Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

// ---------- Configuration binding ----------
// Environment variables always win over appsettings.json, which only holds
// non-secret defaults/structure. See README for the full variable list.
builder.Configuration.AddEnvironmentVariables();

builder.Services.Configure<MongoDbSettings>(options =>
{
    options.ConnectionString = builder.Configuration["MONGODB_CONNECTION_STRING"]
        ?? throw new InvalidOperationException("MONGODB_CONNECTION_STRING is not configured.");
    options.DatabaseName = builder.Configuration["MONGODB_DATABASE_NAME"] ?? "VyaparAI";
});

builder.Services.Configure<JwtSettings>(options =>
{
    options.Secret = builder.Configuration["JWT_SECRET"]
        ?? throw new InvalidOperationException("JWT_SECRET is not configured.");
    options.Issuer = builder.Configuration["JWT_ISSUER"] ?? "VyaparAI";
    options.Audience = builder.Configuration["JWT_AUDIENCE"] ?? "VyaparAIUsers";
});

builder.Services.Configure<AiSettings>(options =>
{
    options.GeminiApiKey = builder.Configuration["GEMINI_API_KEY"] ?? string.Empty;
    options.GeminiModel = builder.Configuration["GEMINI_MODEL"] ?? "gemini-2.0-flash";
});

// ---------- Core services ----------
builder.Services.AddHttpClient();
builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddSingleton<JwtHelper>();
builder.Services.AddScoped<DataSeeder>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<ISaleService, SaleService>();
builder.Services.AddScoped<IPurchaseService, PurchaseService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IFestivalService, FestivalService>();
builder.Services.AddScoped<BusinessContextBuilder>();
builder.Services.AddScoped<DemandForecastService>();
builder.Services.AddScoped<IAiService, AiService>();
builder.Services.AddScoped<ISettingsService, SettingsService>();
builder.Services.AddScoped<IAdminService, AdminService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "VyaparAI API", Version = "v1" });
    c.CustomSchemaIds(type => type.FullName);
    c.AddSecurityDefinition("Bearer", new()
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter the JWT token returned from /api/auth/login"
    });
    c.AddSecurityRequirement(new()
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ---------- CORS: allow only the configured frontend origin ----------
// var frontendUrl = builder.Configuration["FRONTEND_URL"] ?? "https://vyaparai-frontend-plum.vercel.app";
builder.Services.AddCors(options =>
{
    options.AddPolicy("VyaparAIFrontend", policy =>
    {
        policy
            .WithOrigins("https://vyaparai-frontend-plum.vercel.app", "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ---------- JWT Authentication ----------
var jwtSecret = builder.Configuration["JWT_SECRET"]
    ?? throw new InvalidOperationException("JWT_SECRET is not configured.");
var jwtIssuer = builder.Configuration["JWT_ISSUER"] ?? "VyaparAI";
var jwtAudience = builder.Configuration["JWT_AUDIENCE"] ?? "VyaparAIUsers";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.FromMinutes(1)
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// ---------- Ensure MongoDB indexes exist & seed demo data at startup ----------
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
    await dbContext.EnsureIndexesAsync();

    var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
    await seeder.SeedAsync();
}

app.UseSwagger();

app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "VyaparAI API v1");
    c.RoutePrefix = "swagger";
});

app.UseHttpsRedirection();

app.UseCors("VyaparAIFrontend");

app.UseMiddleware<ExceptionMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();