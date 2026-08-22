namespace Ishara.Application.Dictionary;

public sealed record Import3DzSignDbRequest(
  string CategoriesFilePath,
  string SigmlDirectoryPath,
  string SourceName = "3DZSignDB");
