using System.Security.Claims;
using System.Text;
using Ishara.Api.Errors;
using Ishara.Application;
using Ishara.Application.Auth;
using Ishara.Application.Dictionary;
using Ishara.Application.Recognition;
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
    options.AddPolicy("ContributorOrAbove", policy =>
        policy.RequireRole("Contributor", "Moderator", "Researcher", "Admin"));
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("WebDevelopment", policy =>
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
            .AllowAnyHeader()
            .AllowAnyMethod());
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
app.UseCors("WebDevelopment");
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

var recognition = app.MapGroup("/api/recognition");

recognition.MapGet("/status", (IRecognitionService service) =>
    Results.Ok(service.GetStatus()));

recognition.MapPost("/predict", async (
    RecognitionRequest request,
    IRecognitionService service,
    CancellationToken cancellationToken) =>
{
    if (request.Frames is null || request.Frames.Count != 16 || request.Frames.Any(frame => frame.Count != 258))
    {
        return Results.BadRequest(new
        {
            code = "invalid_frames",
            message = "Exactly 16 frames with 258 features per frame are required."
        });
    }

    var result = await service.PredictAsync(request, cancellationToken);
    return result.ModelStatus == "unavailable"
        ? Results.Json(result, statusCode: StatusCodes.Status503ServiceUnavailable)
        : Results.Ok(result);
});

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

var signs = app.MapGroup("/api/signs");

signs.MapGet("/", async (
    string? q,
    string? category,
    int? page,
    int? pageSize,
    IDictionaryRepository dictionary,
    CancellationToken cancellationToken) =>
{
    var result = await dictionary.GetSignsAsync(
        new SignQuery(q, category, page is null or <= 0 ? 1 : page.Value, pageSize is null or <= 0 ? 20 : pageSize.Value),
        cancellationToken);

    return Results.Ok(result);
});

signs.MapGet("/search", async (
    string q,
    int? page,
    int? pageSize,
    IDictionaryRepository dictionary,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(q))
    {
        return Results.BadRequest(new { code = "missing_query", message = "Search query is required." });
    }

    var result = await dictionary.GetSignsAsync(
        new SignQuery(q, null, page is null or <= 0 ? 1 : page.Value, pageSize is null or <= 0 ? 20 : pageSize.Value),
        cancellationToken);

    return Results.Ok(result);
});

signs.MapGet("/{id:guid}", async (
    Guid id,
    IDictionaryRepository dictionary,
    CancellationToken cancellationToken) =>
{
    var sign = await dictionary.GetSignAsync(id, cancellationToken);
    return sign is null ? Results.NotFound() : Results.Ok(sign);
});

signs.MapPost("/import/3dzsigndb", async (
    Import3DzSignDbRequest request,
    IDictionaryImportService importer,
    CancellationToken cancellationToken) =>
{
    var result = await importer.Import3DzSignDbAsync(request, cancellationToken);
    return Results.Ok(result);
}).RequireAuthorization("ContributorOrAbove");

app.MapGet("/api/categories", async (
    IDictionaryRepository dictionary,
    CancellationToken cancellationToken) =>
{
    var categories = await dictionary.GetCategoriesAsync(cancellationToken);
    return Results.Ok(categories);
});

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
