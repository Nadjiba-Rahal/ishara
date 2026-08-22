namespace Ishara.Application.Dictionary;

public sealed record SignDto(
  Guid Id,
  string ArabicLabel,
  string? Gloss,
  string? Category,
  string SourceName,
  string SourceRecordId,
  bool HasHamNoSys,
  bool HasSigml,
  bool HasMedia,
  string? HamNoSys,
  string? Sigml,
  string? MediaUrl);
