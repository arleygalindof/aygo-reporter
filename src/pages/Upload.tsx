import { useState } from "react";
import { Upload as UploadIcon, FileText, CheckCircle, XCircle } from "lucide-react";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [period, setPeriod] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
        setError("Solo se permiten archivos CSV");
        return;
      }
      setFile(selectedFile);
      setError("");
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    if (!category.trim()) {
      setError("Por favor ingresa una categoría");
      return;
    }
    
    if (!period.trim()) {
      setError("Por favor ingresa un período (formato: YYYY-MM)");
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);

    try {
      const userData = localStorage.getItem("user");
      const userId = userData ? JSON.parse(userData).userId : 1;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId.toString());
      formData.append("category", category.trim());
      formData.append("period", period.trim());
      formData.append("isPublic", String(isPublic));

      const response = await fetch("http://localhost:2083/api/upload/csv/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al subir archivo");
      }

      const data = await response.json();
      setResult(data);
      setFile(null);
      setCategory("");
      setPeriod("");
      setIsPublic(false);

      // Notificar al menú lateral para recargar categorías
      window.dispatchEvent(new Event("csv:refreshCategories"));
    } catch (err: any) {
      setError(err.message || "Error al procesar el archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.toLowerCase().endsWith(".csv")) {
      setFile(droppedFile);
      setError("");
      setResult(null);
    } else {
      setError("Solo se permiten archivos CSV");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Cargar Datos CSV</h1>

      {/* Category and Period Inputs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ej: Llamadas Emergencia 123"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Período <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="Formato: YYYY-MM (Ej: 2025-10)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Visibilidad */}
      <div className="mb-6 flex items-center gap-3">
        <input
          id="isPublic"
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isPublic" className="text-sm text-gray-700">
          Marcar como <span className="font-semibold">público</span> (visible para todos los usuarios)
        </label>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition ${
          file
            ? "border-green-500 bg-green-50"
            : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        {file ? (
          <div className="flex flex-col items-center gap-4">
            <FileText className="text-green-600" size={64} />
            <div>
              <p className="text-lg font-semibold text-gray-800">{file.name}</p>
              <p className="text-sm text-gray-600">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Remover archivo
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <UploadIcon className="text-gray-400" size={64} />
            <div>
              <p className="text-lg font-semibold text-gray-700">
                Arrastra tu archivo CSV aquí
              </p>
              <p className="text-sm text-gray-500 mt-1">o selecciona un archivo</p>
            </div>
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition">
              Seleccionar archivo
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {file && !result && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleUpload}
            disabled={uploading || !category.trim() || !period.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold text-lg transition"
          >
            {uploading ? "Procesando..." : "Subir y Analizar"}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="text-red-600 flex-shrink-0" size={24} />
          <div>
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="text-green-600 flex-shrink-0" size={32} />
            <div>
              <p className="text-green-800 font-bold text-xl">¡Archivo procesado exitosamente!</p>
              <p className="text-green-700 text-sm mt-1">{result.message}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div className="bg-white rounded p-3 border border-green-200">
              <p className="text-gray-600 font-medium">Archivo</p>
              <p className="text-gray-800 font-semibold">{result.fileName}</p>
            </div>
            <div className="bg-white rounded p-3 border border-green-200">
              <p className="text-gray-600 font-medium">ID del Reporte</p>
              <p className="text-gray-800 font-semibold">{result.reportId}</p>
            </div>
            <div className="bg-white rounded p-3 border border-green-200">
              <p className="text-gray-600 font-medium">Filas</p>
              <p className="text-gray-800 font-semibold">{result.rowCount}</p>
            </div>
            <div className="bg-white rounded p-3 border border-green-200">
              <p className="text-gray-600 font-medium">Columnas</p>
              <p className="text-gray-800 font-semibold">{result.columnCount}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setResult(null);
              setFile(null);
            }}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
          >
            Cargar otro archivo
          </button>
        </div>
      )}
    </div>
  );
}
