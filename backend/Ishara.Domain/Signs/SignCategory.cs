namespace Ishara.Domain.Signs;

public sealed class SignCategory
{
  private SignCategory()
  {
  }

  public SignCategory(Guid id, string name, string slug, DateTimeOffset createdAtUtc)
  {
    Id = id;
    Name = name;
    Slug = slug;
    CreatedAtUtc = createdAtUtc;
  }

  public Guid Id { get; private set; }

  public string Name { get; private set; } = string.Empty;

  public string Slug { get; private set; } = string.Empty;

  public DateTimeOffset CreatedAtUtc { get; private set; }

  public List<Sign> Signs { get; private set; } = [];
}
