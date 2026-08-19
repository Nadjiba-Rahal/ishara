using Ishara.Api.Errors;
using Ishara.Application;
using Ishara.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole();

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddOpenApi();

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

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/", () => Results.Ok(new
{
    name = "ISHARA API",
    status = "Phase 2 backend foundation",
    description = "Backend foundation for an Algerian Sign Language translation and learning platform."
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

app.Run();

public partial class Program;
