var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.MapGet("/", () => Results.Ok(new
{
    name = "ISHARA API",
    status = "Phase 1 scaffold",
    description = "Backend foundation for an Algerian Sign Language translation and learning platform."
}));

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "ok",
    service = "Ishara.Api",
    utc = DateTimeOffset.UtcNow
}));

app.Run();
