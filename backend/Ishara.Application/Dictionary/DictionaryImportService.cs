using System.Text.Json;
using System.Text.RegularExpressions;
using Ishara.Domain.Signs;

namespace Ishara.Application.Dictionary;

public sealed partial class DictionaryImportService(IDictionaryRepository repository) : IDictionaryImportService
{
  public async Task<Import3DzSignDbResult> Import3DzSignDbAsync(
    Import3DzSignDbRequest request,
    CancellationToken cancellationToken = default)
  {
    if (!File.Exists(request.CategoriesFilePath))
    {
      throw new FileNotFoundException("3DZSignDB categories file was not found.", request.CategoriesFilePath);
    }

    if (!Directory.Exists(request.SigmlDirectoryPath))
    {
      throw new DirectoryNotFoundException($"3DZSignDB SigML directory was not found: {request.SigmlDirectoryPath}");
    }

    await using var stream = File.OpenRead(request.CategoriesFilePath);
    var categories = await JsonSerializer.DeserializeAsync<Dictionary<string, List<string>>>(
      stream,
      cancellationToken: cancellationToken) ?? [];

    var categoriesImported = 0;
    var signsImported = 0;
    var signsUpdated = 0;
    var sigmlFilesLinked = 0;
    var warnings = new List<string>();

    foreach (var (categoryName, labels) in categories)
    {
      var categorySlug = Slugify(categoryName);
      var category = await repository.FindCategoryBySlugAsync(categorySlug, cancellationToken);

      if (category is null)
      {
        category = new SignCategory(Guid.NewGuid(), categoryName.Trim(), categorySlug, DateTimeOffset.UtcNow);
        repository.AddCategory(category);
        categoriesImported++;
      }

      foreach (var rawLabel in labels.Where(label => !string.IsNullOrWhiteSpace(label)))
      {
        var label = rawLabel.Trim();
        var sourceRecordId = Slugify(label);
        var sign = await repository.FindSignBySourceAsync(request.SourceName, sourceRecordId, cancellationToken);
        var sigml = TryReadSigml(request.SigmlDirectoryPath, label);

        if (sign is null)
        {
          sign = new Sign(Guid.NewGuid(), label, request.SourceName, sourceRecordId, DateTimeOffset.UtcNow);
          sign.AssignCategory(category);
          sign.SetRepresentations(null, sigml);
          repository.AddSign(sign);
          signsImported++;
        }
        else
        {
          sign.AssignCategory(category);
          sign.SetRepresentations(sign.HamNoSys, sigml, sign.MediaUrl);
          signsUpdated++;
        }

        if (sigml is not null)
        {
          sigmlFilesLinked++;
        }
        else
        {
          warnings.Add($"No SigML file found for '{label}'.");
        }
      }
    }

    await repository.SaveChangesAsync(cancellationToken);

    return new Import3DzSignDbResult(
      categoriesImported,
      signsImported,
      signsUpdated,
      sigmlFilesLinked,
      warnings);
  }

  private static string? TryReadSigml(string sigmlDirectoryPath, string label)
  {
    var candidates = new[]
    {
      Path.Combine(sigmlDirectoryPath, $"{label}.sigml"),
      Path.Combine(sigmlDirectoryPath, $"{Slugify(label)}.sigml")
    };

    var path = candidates.FirstOrDefault(File.Exists);
    return path is null ? null : File.ReadAllText(path);
  }

  public static string Slugify(string value)
  {
    var normalized = WhitespaceRegex().Replace(value.Trim().ToLowerInvariant(), "-");
    return UnsafeSlugCharactersRegex().Replace(normalized, string.Empty);
  }

  [GeneratedRegex(@"\s+")]
  private static partial Regex WhitespaceRegex();

  [GeneratedRegex(@"[^\p{L}\p{N}\-]+")]
  private static partial Regex UnsafeSlugCharactersRegex();
}
