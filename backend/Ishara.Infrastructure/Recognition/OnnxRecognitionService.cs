using System.Text.Json;
using Ishara.Application.Recognition;
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;
using Microsoft.Extensions.Configuration;

namespace Ishara.Infrastructure.Recognition;

/// <summary>
/// ONNX adapter for the supplied IsharaFinal model. The model metadata is
/// loaded alongside the model so shape and label assumptions stay explicit.
/// </summary>
public sealed class OnnxRecognitionService : IRecognitionService, IDisposable
{
  private readonly InferenceSession? _session;
  private readonly string[] _labels;
  private readonly string? _modelVersion = null;
  private readonly string? _datasetVersion = null;
  private readonly string _inputName = "landmarks";
  private readonly string _outputName = "logits";
  private readonly string? _loadError;

  public OnnxRecognitionService(IConfiguration configuration)
  {
    var configuredPath = configuration["Recognition:ModelPath"];
    var modelPath = string.IsNullOrWhiteSpace(configuredPath)
      ? null
      : new[] { configuredPath, Path.Combine(AppContext.BaseDirectory, configuredPath) }
        .Select(Path.GetFullPath)
        .FirstOrDefault(File.Exists);
    try
    {
      if (string.IsNullOrWhiteSpace(modelPath) || !File.Exists(modelPath))
      {
        _loadError = "Recognition model is not available";
        _labels = [];
        return;
      }

      var directory = Path.GetDirectoryName(modelPath)!;
      var metadata = JsonSerializer.Deserialize<ModelMetadata>(
        File.ReadAllText(Path.Combine(directory, "metadata.json"))) ?? throw new InvalidDataException("Invalid model metadata.");
      var labels = JsonSerializer.Deserialize<Dictionary<string, string>>(
        File.ReadAllText(Path.Combine(directory, "labels.json"))) ?? throw new InvalidDataException("Invalid model labels.");

      _session = new InferenceSession(modelPath);
      _labels = labels.OrderBy(pair => int.Parse(pair.Key)).Select(pair => pair.Value).ToArray();
      _modelVersion = metadata.Model;
      _datasetVersion = metadata.Dataset;
      _inputName = metadata.InputName;
      _outputName = metadata.OutputName;
    }
    catch (Exception exception) when (exception is IOException or JsonException or InvalidDataException or OnnxRuntimeException)
    {
      _loadError = "Recognition model could not be loaded.";
      _labels = [];
    }
  }

  public RecognitionStatusResponse GetStatus() =>
    _session is null
      ? new("unavailable", _loadError ?? "Recognition model is not available", null, null)
      : new("ready", "Recognition model is available", _modelVersion, _datasetVersion);

  public Task<RecognitionResponse> PredictAsync(RecognitionRequest request, CancellationToken cancellationToken)
  {
    if (_session is null || request.Frames is null)
    {
      var unavailable = GetStatus();
      return Task.FromResult(new RecognitionResponse(false, null, null, unavailable.Status, unavailable.ModelVersion, unavailable.DatasetVersion, []));
    }

    var frames = request.Frames;
    var tensor = new DenseTensor<float>(new[] { 1, 16, 258 });
    for (var frame = 0; frame < 16; frame++)
    {
      for (var feature = 0; feature < 258; feature++)
      {
        tensor[0, frame, feature] = frames[frame][feature];
      }
    }

    using var results = _session.Run([NamedOnnxValue.CreateFromTensor(_inputName, tensor)]);
    var logits = results.First(result => result.Name == _outputName).AsTensor<float>().ToArray();
    var probabilities = Softmax(logits);
    var ranked = probabilities
      .Select((confidence, index) => new RecognitionCandidate(
        index < _labels.Length ? _labels[index] : $"class_{index}", confidence))
      .OrderByDescending(candidate => candidate.Confidence)
      .Take(5)
      .ToArray();
    var best = ranked[0];
    return Task.FromResult(new RecognitionResponse(true, best.Sign, best.Confidence, "ready", _modelVersion, _datasetVersion, ranked));
  }

  private static float[] Softmax(float[] logits)
  {
    var max = logits.Max();
    var exponentials = logits.Select(value => MathF.Exp(value - max)).ToArray();
    var total = exponentials.Sum();
    return exponentials.Select(value => value / total).ToArray();
  }

  public void Dispose() => _session?.Dispose();

  private sealed record ModelMetadata(
    string Dataset,
    string Model,
    [property: System.Text.Json.Serialization.JsonPropertyName("input_name")] string InputName,
    [property: System.Text.Json.Serialization.JsonPropertyName("output_name")] string OutputName);
}