import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText, Calendar, Database, ArrowLeft, Loader, Trash2, ChevronLeft, ChevronRight, Download, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";

type CsvReport = {
  id: string;
  userId: number;
  fileName: string;
  originalFileName: string;
  category: string;
  period: string;
  fileSize: number;
  rowCount: number;
  delimiter?: string;
  isPublic?: boolean;
  headers: string[];
  rows: Record<string, any>[];
  uploadedAt: string;
  status: string;
};

export default function ReportAnalysis() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<CsvReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [filterColumn, setFilterColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const pageSize = 100;

  const filteredRows = report?.rows?.filter((row) => {
    if (!filterColumn || !filterValue) return true;
    const cellValue = String(row[filterColumn] ?? "").toLowerCase();
    return cellValue.includes(filterValue.toLowerCase());
  }) ?? [];

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = String(a[sortColumn] ?? "");
    const bVal = String(b[sortColumn] ?? "");
    const comparison = aVal.localeCompare(bVal, undefined, { numeric: true });
    return sortDirection === "asc" ? comparison : -comparison;
  });

  /**
   * Handles table header click for sorting.
   * If same column clicked, toggles direction (asc ↔ desc).
   * If new column clicked, sorts ascending by default.
   * @param header - Column name to sort by
   * @returns void
   * @effect Updates sortColumn and sortDirection state
   * @effect Triggers useMemo recalculation of sortedRows
   */
  const handleHeaderClick = (header: string) => {
    if (sortColumn === header) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(header);
      setSortDirection("asc");
    }
  };

  useEffect(() => {
    if (reportId) {
      fetchReport(reportId);
    }
  }, [reportId]);

  const fetchReport = async (id: string) => {
    try {
      setLoading(true);
      const userData = localStorage.getItem("user");
      const userId = userData ? JSON.parse(userData).userId : 1;
      const response = await fetch(`http://localhost:2084/api/reports/csv/${id}?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error("No se pudo cargar el reporte");
      }

      const data = await response.json();
      setReport(data);
      setPage(1);
      setFilterColumn("");
      setFilterValue("");
      setVisibleColumns(data.headers || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar el reporte");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!reportId) return;
    const confirmed = window.confirm("¿Eliminar este reporte? Esta acción no se puede deshacer.");
    if (!confirmed) return;

    try {
      setDeleting(true);
      const response = await fetch(`http://localhost:2084/api/reports/csv/${reportId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo eliminar el reporte");
      }

      // Notificar al menú lateral para recargar categorías
      window.dispatchEvent(new Event("csv:refreshCategories"));

      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message || "Error eliminando el reporte");
    } finally {
      setDeleting(false);
    }
  };

  const toggleColumn = (column: string) => {
    setVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    );
  };

  const toggleAllColumns = () => {
    if (visibleColumns.length === report?.headers.length) {
      setVisibleColumns([]);
    } else {
      setVisibleColumns(report?.headers || []);
    }
  };

  const exportToCSV = () => {
    if (!report) return;

    // Usar solo columnas visibles
    const headers = report.headers.filter((h) => visibleColumns.includes(h));
    
    // Construir CSV con delimitador apropiado
    const delimiter = report.delimiter || ",";
    const csvContent = [
      headers.join(delimiter),
      ...filteredRows.map((row) =>
        headers
          .map((header) => {
            const value = row[header] !== null && row[header] !== undefined ? String(row[header]) : "";
            // Escapar valores que contengan el delimitador, comillas o saltos de línea
            if (value.includes(delimiter) || value.includes('"') || value.includes("\n")) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(delimiter)
      ),
    ].join("\n");

    // Crear blob y descargar
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${report.category}_${report.period}_filtered.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Cargando reporte...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">{error || "Reporte no encontrado"}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Volver</span>
        </button>
        
        <h1 className="text-3xl font-bold mb-2">{report.category}</h1>
        <p className="text-gray-600">Período: {report.period}</p>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-md text-sm font-semibold transition"
          >
            <Trash2 size={16} />
            {deleting ? "Eliminando..." : "Eliminar reporte"}
          </button>

          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition"
          >
            {showColumnSelector ? <EyeOff size={16} /> : <Eye size={16} />}
            {showColumnSelector ? "Ocultar selector" : "Seleccionar columnas"}
          </button>

          <button
            onClick={exportToCSV}
            disabled={filteredRows.length === 0 || visibleColumns.length === 0}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-md text-sm font-semibold transition"
          >
            <Download size={16} />
            Exportar CSV ({filteredRows.length} filas)
          </button>
        </div>
      </div>

      {/* Column Selector */}
      {showColumnSelector && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Columnas Visibles</h3>
            <button
              onClick={toggleAllColumns}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {visibleColumns.length === report.headers.length ? "Deseleccionar todas" : "Seleccionar todas"}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {report.headers.map((header) => (
              <label
                key={header}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(header)}
                  onChange={() => toggleColumn(header)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">{header}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Report Info Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <FileText className="text-blue-600 flex-shrink-0" size={24} />
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-sm text-gray-600">Archivo</p>
              <p className="font-semibold text-gray-800 truncate overflow-hidden text-ellipsis whitespace-nowrap" title={report.originalFileName}>{report.originalFileName}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Database className="text-green-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Filas</p>
              <p className="font-semibold text-gray-800">{report.rowCount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Database className="text-purple-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Columnas</p>
              <p className="font-semibold text-gray-800">{report.headers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-orange-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Cargado</p>
              <p className="font-semibold text-gray-800">
                {new Date(report.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Vista de Datos</h2>
            <p className="text-sm text-gray-600 mt-1">
              Mostrando {Math.min(pageSize, Math.max(0, filteredRows.length - (page - 1) * pageSize))} de {filteredRows.length} registros (Total: {report.rowCount})
            </p>
          </div>

          {/* Filter */}
          <div className="flex items-end gap-3">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por columna</label>
              <select
                value={filterColumn}
                onChange={(e) => {
                  setFilterColumn(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Todas las columnas --</option>
                {report.headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Escribe para filtrar..."
                  value={filterValue}
                  onChange={(e) => {
                    setFilterValue(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {filterValue && (
                  <button
                    onClick={() => {
                      setFilterValue("");
                      setPage(1);
                    }}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                {report.headers
                  .filter((header) => visibleColumns.includes(header))
                  .map((header, index) => (
                    <th
                      key={index}
                      onClick={() => handleHeaderClick(header)}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span>{header}</span>
                        {sortColumn === header && (
                          sortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        )}
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedRows
                .slice((page - 1) * pageSize, page * pageSize)
                .map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {report.headers
                      .filter((header) => visibleColumns.includes(header))
                      .map((header, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap"
                        >
                          {row[header] !== null && row[header] !== undefined
                            ? String(row[header])
                            : "-"}
                        </td>
                      ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between text-sm text-gray-700 bg-gray-50 border-t">
          <div className="font-semibold">
            Página {page} de {Math.max(1, Math.ceil(sortedRows.length / pageSize))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
            >
              <ChevronLeft size={18} />
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => (p * pageSize < sortedRows.length ? p + 1 : p))}
              disabled={page * pageSize >= sortedRows.length}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
            >
              Siguiente
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
