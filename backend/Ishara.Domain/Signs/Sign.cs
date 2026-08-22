namespace Ishara.Domain.Signs;

public sealed class Sign
{
  private Sign()
  {
  }

  public Sign(
    Guid id,
    string arabicLabel,
    string sourceName,
    string sourceRecordId,
    DateTimeOffset createdAtUtc)
  {
    Id = id;
    ArabicLabel = arabicLabel;
    SourceName = sourceName;
    SourceRecordId = sourceRecordId;
    CreatedAtUtc = createdAtUtc;
  }

  public Guid Id { get; private set; }

  public string ArabicLabel { get; private set; } = string.Empty;

  public string? Gloss { get; private set; }

  public Guid? CategoryId { get; private set; }

  public SignCategory? Category { get; private set; }

  public string SourceName { get; private set; } = string.Empty;

  public string SourceRecordId { get; private set; } = string.Empty;

  public string? HamNoSys { get; private set; }

  public string? Sigml { get; private set; }

  public string? MediaUrl { get; private set; }

  public DateTimeOffset CreatedAtUtc { get; private set; }

  public void AssignCategory(SignCategory category)
  {
    Category = category;
    CategoryId = category.Id;
  }

  public void SetRepresentations(string? hamNoSys, string? sigml, string? mediaUrl = null)
  {
    HamNoSys = string.IsNullOrWhiteSpace(hamNoSys) ? null : hamNoSys.Trim();
    Sigml = string.IsNullOrWhiteSpace(sigml) ? null : sigml.Trim();
    MediaUrl = string.IsNullOrWhiteSpace(mediaUrl) ? null : mediaUrl.Trim();
  }
}
