using System.Security.Claims;
using System.Text;
using Ishara.Api.Errors;
using Ishara.Application;
using Ishara.Application.Auth;
using Ishara.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole();

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddOpenApi();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

var jwtOptions = builder.Configuration
    .GetSection(JwtOptions.SectionName)
    .Get<JwtOptions>() ?? new JwtOptions();

if (string.IsNullOrWhiteSpace(jwtOptions.SigningKey) || jwtOptions.SigningKey.Length < 32)
{
    throw new InvalidOperationException("Jwt:SigningKey must be configured with at least 32 characters.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = ClaimTypes.Name,
            RoleClaimType = ClaimTypes.Role
        };
    });

builder.Services
    .AddApplication()
    .AddInfrastructure(builder.Configuration);

var postgresConnection = builder.Configuration.GetConnectionString("Postgres");
var healthChecks = builder.Services.AddHealthChecks();

if (!string.IsNullOrWhiteSpace(postgresConnection))
{
    healthChecks.AddNpgSql(postgresConnection, name: "postgres");
}

var app = builder.Build();

app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/", () => Results.Ok(new
{
    name = "ISHARA API",
    status = "Phase 3 authentication",
    description = "Authentication foundation for an Algerian Sign Language translation and learning platform."
}));

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "ok",
    service = "Ishara.Api",
    utc = DateTimeOffset.UtcNow
}));

app.MapHealthChecks("/api/health/live", new()
{
    Predicate = _ => false
});

app.MapHealthChecks("/api/health/ready");

var auth = app.MapGroup("/api/auth");

auth.MapPost("/register", async (
    RegisterUserRequest request,
    IAuthService authService,
    CancellationToken cancellationToken) =>
{
    var result = await authService.RegisterAsync(request, cancellationToken);

    return result.Succeeded
        ? Results.Created("/api/auth/me", result.Response)
        : ToProblemResult(result);
});

auth.MapPost("/login", async (
    LoginRequest request,
    IAuthService authService,
    CancellationToken cancellationToken) =>
{
    var result = await authService.LoginAsync(request, cancellationToken);

    return result.Succeeded
        ? Results.Ok(result.Response)
        : Results.Problem(
            title: result.Message,
            statusCode: StatusCodes.Status401Unauthorized,
            extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode });
});

auth.MapPost("/refresh", async (
    RefreshTokenRequest request,
    IAuthService authService,
    CancellationToken cancellationToken) =>
{
    var result = await authService.RefreshAsync(request, cancellationToken);

    return result.Succeeded
        ? Results.Ok(result.Response)
        : Results.Problem(
            title: result.Message,
            statusCode: StatusCodes.Status401Unauthorized,
            extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode });
});

auth.MapPost("/logout", async (
    LogoutRequest request,
    IAuthService authService,
    CancellationToken cancellationToken) =>
{
    await authService.LogoutAsync(request, cancellationToken);
    return Results.NoContent();
});

auth.MapGet("/me", (ClaimsPrincipal user) => Results.Ok(new
{
    userId = user.FindFirstValue(ClaimTypes.NameIdentifier),
    email = user.FindFirstValue(ClaimTypes.Email),
    displayName = user.FindFirstValue(ClaimTypes.Name),
    role = user.FindFirstValue(ClaimTypes.Role)
})).RequireAuthorization();

auth.MapGet("/admin-check", () => Results.Ok(new
{
    status = "authorized",
    role = "Admin"
})).RequireAuthorization("AdminOnly");

app.Run();

static IResult ToProblemResult(AuthResult result)
{
    var statusCode = result.ErrorCode == "email_taken"
        ? StatusCodes.Status409Conflict
        : StatusCodes.Status400BadRequest;

    return Results.Problem(
        title: result.Message,
        statusCode: statusCode,
        extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode });
}

public partial class Program;
