namespace Ishara.Application.Dictionary;

public sealed record Import3DzSignDbResult(
  int CategoriesImported,
  int SignsImported,
  int SignsUpdated,
  int SigmlFilesLinked,
  IReadOnlyList<string> Warnings);
