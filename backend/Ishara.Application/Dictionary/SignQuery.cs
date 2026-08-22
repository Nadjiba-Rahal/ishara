namespace Ishara.Application.Dictionary;

public sealed record SignQuery(
  string? Q,
  string? Category,
  int Page = 1,
  int PageSize = 20);
