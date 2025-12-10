import { useEffect, useMemo, useState, useCallback } from "react";
import { Filter, Loader2, AlertCircle, X } from "lucide-react";
import * as Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "highcharts/modules/exporting";

type PeriodInfo = {
  reportId: string;
  period: string;
  fileName: string;
  rowCount: number;
  uploadedAt: string;
};

type CategoriesData = {
  [category: string]: PeriodInfo[];
};

type CsvReport = {
  id: string;
  userId: number;
  category: string;
  period: string;
  headers: string[];
  rows: Record<string, any>[];
};

type ChartPoint = { name: string; y: number };

/**
 * Builds a frequency count of values in a CSV column, sorted descending by count.
 * Used to generate data for all chart types (bar, column, pie, line, area, scatter).
 * @param rows - Array of data rows from the CSV
 * @param column - Column name to count
 * @param top - Maximum items to return (default 999 = all)
 * @returns Array of {name, y} objects sorted by frequency descending
 */
const buildCounts = (rows: Record<string, any>[], column?: string, top = 999): ChartPoint[] => {
  if (!column) return [];
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const raw = row[column];
    if (raw === null || raw === undefined) return;
    const key = String(raw).trim();
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([name, y]) => ({ name, y }));
};

/**
 * Safely extracts userId from localStorage with fallback to default value.
 * Handles missing data, JSON parse errors, and missing userId property.
 * @returns User ID (number) from localStorage or default 1 if not found
 * @throws Never throws; always returns a number
 */
const tryGetUserId = () => {
  const userData = localStorage.getItem("user");
  if (!userData) return 1;
  try {
    const parsed = JSON.parse(userData);
    return parsed?.userId || 1;
  } catch (e) {
    return 1;
  }
};

export default function Statistics() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [categories, setCategories] = useState<CategoriesData>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [report, setReport] = useState<CsvReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string>("");
  const [filterColumnDynamic, setFilterColumnDynamic] = useState<string>("");
  const [filterValueDynamic, setFilterValueDynamic] = useState<string>("");
  const [appliedDynamicFilter, setAppliedDynamicFilter] = useState<{ column: string; value: string } | null>(null);
  
  // Selectores para las columnas de gráficos dinámicos
  const [selectedChartColumn1, setSelectedChartColumn1] = useState<string>("");
  const [selectedChartColumn2, setSelectedChartColumn2] = useState<string>("");
  const [selectedChartColumn3, setSelectedChartColumn3] = useState<string>("");
  const [chartType1, setChartType1] = useState<"bar" | "pie" | "line" | "area" | "column" | "scatter">("bar");
  const [chartType2, setChartType2] = useState<"bar" | "pie" | "line" | "area" | "column" | "scatter">("bar");
  const [chartType3, setChartType3] = useState<"bar" | "pie" | "line" | "area" | "column" | "scatter">("bar");

  /**
   * Loads all report categories and periods for current user.
   * Tries multiple userId candidates (from localStorage, defaults 1 and 17).
   * @async
   * @returns Promise<void>
   * @effect Sets categories state with category → periods mapping
   * @effect Sets loadingCategories true/false
   * @effect Sets error message if all attempts fail
   * @api GET /api/reports/csv/categories/{userId}
   */
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    setError("");
    try {
      const candidates: number[] = [];

      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          if (parsed?.userId) {
            candidates.push(Number(parsed.userId));
          }
        } catch (e) {
          console.warn("No se pudo parsear localStorage.user, se probarán valores por defecto");
        }
      }

      candidates.push(1);
      candidates.push(17);

      let loaded = false;
      for (const candidate of candidates) {
        const response = await fetch(`http://localhost:2084/api/reports/csv/categories/${candidate}`);
        if (!response.ok) continue;
        const data = await response.json();
        setCategories(data);
        loaded = true;
        if (Object.keys(data).length > 0 || candidate !== 1) {
          break;
        }
      }

      if (!loaded) {
        setError("No se pudieron cargar las categorías");
      }
    } catch (err) {
      console.error("Error fetching categories", err);
      setError("No se pudieron cargar las categorías");
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (!selectedCategory) {
      const firstCategory = Object.keys(categories)[0];
      if (firstCategory) {
        setSelectedCategory(firstCategory);
      }
      return;
    }

    const periods = categories[selectedCategory] || [];
    if (periods.length > 0 && !periods.some((p) => p.reportId === selectedReportId)) {
      setSelectedReportId(periods[0].reportId);
    }
  }, [categories, selectedCategory, selectedReportId]);

  /**
   * Loads full CSV report data (headers + rows) from backend.
   * Resets all dynamic filters after loading new report.
   * @async
   * @param reportId - ID of the report to fetch
   * @returns Promise<void>
   * @effect Sets report state with CSV data
   * @effect Resets dynamic filter states to null
   * @effect Sets loadingReport true/false
   * @effect Sets error message on failure
   * @api GET /api/reports/csv/{reportId}?userId={userId}
   */
  const fetchReport = useCallback(async (reportId: string) => {
    setLoadingReport(true);
    setError("");
    try {
      const userId = tryGetUserId();
      const response = await fetch(`http://localhost:2084/api/reports/csv/${reportId}?userId=${userId}`);
      if (!response.ok) {
        throw new Error("No se pudo cargar el reporte");
      }
      const data = await response.json();
      setReport({
        id: data.id,
        userId: data.userId,
        category: data.category,
        period: data.period,
        headers: data.headers || [],
        rows: data.rows || [],
      });
      setFilterColumnDynamic("");
      setFilterValueDynamic("");
      setAppliedDynamicFilter(null);
    } catch (err: any) {
      setError(err.message || "Error al cargar el reporte");
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  }, []);

  useEffect(() => {
    if (selectedReportId) {
      fetchReport(selectedReportId);
    }
  }, [selectedReportId, fetchReport]);

  // Column detection removed: columns are now selected manually by users in the UI

  const uniqueValuesForColumn = useMemo(() => {
    if (!report || !filterColumnDynamic) return [] as string[];
    const set = new Set<string>();
    (report.rows || []).forEach((row) => {
      const v = row[filterColumnDynamic];
      if (v === null || v === undefined) return;
      const text = String(v).trim();
      if (text) set.add(text);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b)).slice(0, 200);
  }, [report, filterColumnDynamic]);

  const filteredRows = useMemo(() => {
    if (!report) return [] as Record<string, any>[];
    if (appliedDynamicFilter && appliedDynamicFilter.column && appliedDynamicFilter.value) {
      return (report.rows || []).filter((row) => String(row[appliedDynamicFilter.column] ?? "").trim() === appliedDynamicFilter.value);
    }
    return report.rows || [];
  }, [report, appliedDynamicFilter]);

  /**
   * Applies or clears dynamic filter based on selected column and value.
   * Updates appliedDynamicFilter state, which triggers filteredRows recalculation.
   * @returns void
   * @effect Sets appliedDynamicFilter state
   * @effect Triggers useMemo recalculation of filteredRows
   */
  const aplicarFiltros = () => {
    if (filterColumnDynamic && filterValueDynamic) {
      setAppliedDynamicFilter({ column: filterColumnDynamic, value: filterValueDynamic });
    } else {
      setAppliedDynamicFilter(null);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Estadísticas</h1>

      <div className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Categoría</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">Selecciona una categoría</option>
              {Object.keys(categories).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Período / archivo</label>
            <select
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="w-full border rounded p-2"
              disabled={!selectedCategory}
            >
              <option value="">Selecciona un período</option>
              {(categories[selectedCategory] || []).map((period) => (
                <option key={period.reportId} value={period.reportId}>
                  {period.period} - {period.fileName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={aplicarFiltros}
              className="w-full bg-[#0f2a44] text-white px-4 py-2 rounded"
            >
              Aplicar filtros
            </button>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 bg-[#0f2a44] text-white px-4 py-2 rounded hover:bg-[#163a5d]"
          >
            <Filter size={18} />
            Filtros avanzados
          </button>

          {loadingCategories && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 size={16} className="animate-spin" />
              Cargando categorías...
            </div>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="bg-gray-50 rounded-xl p-6 mb-6 border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Columna</label>
              <select
                value={filterColumnDynamic}
                onChange={(e) => {
                  setFilterColumnDynamic(e.target.value);
                  setFilterValueDynamic("");
                }}
                className="w-full border rounded p-2"
                disabled={!report}
              >
                <option value="">Selecciona columna</option>
                {(report?.headers || []).map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Valor</label>
              <select
                value={filterValueDynamic}
                onChange={(e) => setFilterValueDynamic(e.target.value)}
                className="w-full border rounded p-2"
                disabled={!filterColumnDynamic}
              >
                <option value="">Selecciona valor</option>
                {uniqueValuesForColumn.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={aplicarFiltros}
                className="w-full bg-[#0f2a44] text-white px-4 py-2 rounded disabled:bg-gray-300"
                disabled={!filterColumnDynamic}
              >
                Aplicar filtro
              </button>
            </div>
          </div>

          {appliedDynamicFilter && (
            <div className="mt-3 inline-flex items-center gap-2 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-3 py-2">
              <span>Filtro aplicado: {appliedDynamicFilter.column} = {appliedDynamicFilter.value}</span>
              <button
                onClick={() => {
                  setAppliedDynamicFilter(null);
                  setFilterValueDynamic("");
                }}
                className="text-blue-700 hover:text-blue-900"
                aria-label="Quitar filtro"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded p-3">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loadingReport && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Loader2 size={16} className="animate-spin" />
          Cargando datos del reporte...
        </div>
      )}

      {noDataMessage && (
        <div className="mb-4 text-sm text-gray-600">No se encontraron columnas para tipo, prioridad o localidad en este reporte.</div>
      )}

      {/* Selectores para gráficos dinámicos */}
      {report && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Personalizar Gráficos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gráfico 1 */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-sm mb-3">Gráfico 1</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600 font-medium mb-1 block">Columna a analizar</label>
                  <select
                    value={selectedChartColumn1}
                    onChange={(e) => setSelectedChartColumn1(e.target.value)}
                    className="w-full border rounded p-2 text-sm"
                  >
                    <option value="">Selecciona columna</option>
                    {(report?.headers || []).map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium mb-1 block">Tipo de gráfico</label>
                  <select
                    value={chartType1}
                    onChange={(e) => setChartType1(e.target.value as any)}
                    className="w-full border rounded p-2 text-sm"
                  >
                    <option value="bar">Barras</option>
                    <option value="column">Columnas</option>
                    <option value="pie">Circular</option>
                    <option value="line">Líneas</option>
                    <option value="area">Área</option>
                    <option value="scatter">Dispersión</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Gráfico 2 */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-sm mb-3">Gráfico 2</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600 font-medium mb-1 block">Columna a analizar</label>
                  <select
                    value={selectedChartColumn2}
                    onChange={(e) => setSelectedChartColumn2(e.target.value)}
                    className="w-full border rounded p-2 text-sm"
                  >
                    <option value="">Selecciona columna</option>
                    {(report?.headers || []).map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium mb-1 block">Tipo de gráfico</label>
                  <select
                    value={chartType2}
                    onChange={(e) => setChartType2(e.target.value as any)}
                    className="w-full border rounded p-2 text-sm"
                  >
                    <option value="bar">Barras</option>
                    <option value="column">Columnas</option>
                    <option value="pie">Circular</option>
                    <option value="line">Líneas</option>
                    <option value="area">Área</option>
                    <option value="scatter">Dispersión</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Gráfico 3 */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-sm mb-3">Gráfico 3</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600 font-medium mb-1 block">Columna a analizar</label>
                  <select
                    value={selectedChartColumn3}
                    onChange={(e) => setSelectedChartColumn3(e.target.value)}
                    className="w-full border rounded p-2 text-sm"
                  >
                    <option value="">Selecciona columna</option>
                    {(report?.headers || []).map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium mb-1 block">Tipo de gráfico</label>
                  <select
                    value={chartType3}
                    onChange={(e) => setChartType3(e.target.value as any)}
                    className="w-full border rounded p-2 text-sm"
                  >
                    <option value="bar">Barras</option>
                    <option value="column">Columnas</option>
                    <option value="pie">Circular</option>
                    <option value="line">Líneas</option>
                    <option value="area">Área</option>
                    <option value="scatter">Dispersión</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
        {selectedChartColumn1 && (
          <ChartCard 
            title={`Análisis de ${selectedChartColumn1}`} 
            subtitle={`Tipo: ${chartType1}`}
            chartId="chart1"
          >
            <DynamicChart 
              data={buildCounts(filteredRows, selectedChartColumn1)} 
              type={chartType1} 
            />
          </ChartCard>
        )}

        {selectedChartColumn2 && (
          <ChartCard 
            title={`Análisis de ${selectedChartColumn2}`} 
            subtitle={`Tipo: ${chartType2}`}
            chartId="chart2"
          >
            <DynamicChart 
              data={buildCounts(filteredRows, selectedChartColumn2)} 
              type={chartType2} 
            />
          </ChartCard>
        )}

        {selectedChartColumn3 && (
          <ChartCard 
            title={`Análisis de ${selectedChartColumn3}`} 
            subtitle={`Tipo: ${chartType3}`}
            chartId="chart3"
          >
            <DynamicChart 
              data={buildCounts(filteredRows, selectedChartColumn3)} 
              type={chartType3} 
            />
          </ChartCard>
        )}

        {!selectedChartColumn1 && !selectedChartColumn2 && !selectedChartColumn3 && (
          <div className="col-span-full text-center text-gray-500 py-8">
            Selecciona columnas para visualizar los gráficos
          </div>
        )}
      </div>
    </>
  );
}

type ChartCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  chartId: string;
};

function ChartCard({ title, subtitle, children, chartId }: ChartCardProps) {
  return (
    <div className="bg-white rounded-xl shadow hover:shadow-xl transition-all duration-300 p-4 animate-fadeIn group">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
          {subtitle && <p className="text-[11px] text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div id={chartId} className="h-50 transition-transform duration-300 group-hover:scale-[1.01]">
        {children}
      </div>
    </div>
  );
}

type DynamicChartProps = {
  data: ChartPoint[];
  compareData?: ChartPoint[];
  type: "bar" | "pie" | "line" | "area" | "column" | "scatter";
};

function DynamicChart({ data, compareData, type }: DynamicChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-50 text-gray-400">
        Sin datos
      </div>
    );
  }

  // Paleta de colores oscuros profesionales
  const colors = ["#1e40af", "#0369a1", "#0891b2", "#5b21b6", "#be185d", "#92400e"];

  // Preparar datos para Highcharts
  const chartData = data.map((item) => ({
    name: item.name,
    y: item.y,
  }));

  // Preparar datos de comparación si existen
  const compareChartData = compareData ? compareData.map((item) => ({
    name: item.name,
    y: item.y,
  })) : undefined;

  if (type === "bar") {
    const series: Highcharts.SeriesOptionsType[] = [
      {
        type: "bar",
        name: "Principal",
        data: chartData,
        color: colors[0]
      }
    ];

    if (compareChartData) {
      series.push({
        type: "bar",
        name: "Comparación",
        data: compareChartData,
        color: colors[1]
      });
    }

    const options: Highcharts.Options = {
      chart: { 
        type: "bar",
        backgroundColor: "transparent",
        style: { fontFamily: "system-ui, -apple-system, sans-serif" }
      },
      title: { text: "" },
      xAxis: {
        categories: data.map((d) => d.name),
        lineWidth: 0,
        tickLength: 0,
        labels: { style: { color: "#6b7280", fontSize: "12px" } }
      },
      yAxis: {
        title: { text: "" },
        allowDecimals: false,
        gridLineWidth: 1,
        gridLineColor: "#e5e7eb",
        labels: { style: { color: "#6b7280", fontSize: "11px" } }
      },
      legend: { 
        enabled: compareChartData ? true : false,
        itemStyle: { color: "#6b7280", fontSize: "12px" }
      },
      tooltip: {
        backgroundColor: "#111827",
        borderColor: "#374151",
        borderRadius: 4,
        borderWidth: 1,
        shadow: false,
        style: { color: "#ffffff", fontSize: "12px" },
        shared: true
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: false
          },
          pointPadding: 0.1,
          groupPadding: 0.15
        }
      },
      credits: { enabled: false },
      series: series
    };

    return <HighchartsReact highcharts={Highcharts} options={options} />;
  }

  if (type === "column") {
    const series: Highcharts.SeriesOptionsType[] = [
      {
        type: "column",
        name: "Principal",
        data: chartData,
        color: colors[0]
      }
    ];

    if (compareChartData) {
      series.push({
        type: "column",
        name: "Comparación",
        data: compareChartData,
        color: colors[1]
      });
    }

    const options: Highcharts.Options = {
      chart: { 
        type: "column",
        backgroundColor: "transparent",
        style: { fontFamily: "system-ui, -apple-system, sans-serif" }
      },
      title: { text: "" },
      xAxis: {
        categories: data.map((d) => d.name),
        lineWidth: 0,
        tickLength: 0,
        labels: { style: { color: "#6b7280", fontSize: "12px" } }
      },
      yAxis: {
        title: { text: "" },
        allowDecimals: false,
        gridLineWidth: 1,
        gridLineColor: "#e5e7eb",
        labels: { style: { color: "#6b7280", fontSize: "11px" } }
      },
      legend: { 
        enabled: compareChartData ? true : false,
        itemStyle: { color: "#6b7280", fontSize: "12px" }
      },
      tooltip: {
        backgroundColor: "#111827",
        borderColor: "#374151",
        borderRadius: 4,
        borderWidth: 1,
        shadow: false,
        style: { color: "#ffffff", fontSize: "12px" },
        shared: true
      },
      plotOptions: {
        column: {
          dataLabels: {
            enabled: false
          },
          pointPadding: 0.1,
          groupPadding: 0.2
        }
      },
      credits: { enabled: false },
      series: series
    };

    return <HighchartsReact highcharts={Highcharts} options={options} />;
  }

  if (type === "pie") {
    const options: Highcharts.Options = {
      chart: { 
        type: "pie",
        backgroundColor: "transparent",
        style: { fontFamily: "system-ui, -apple-system, sans-serif" }
      },
      title: { text: "" },
      tooltip: {
        backgroundColor: "#111827",
        borderColor: "#374151",
        borderRadius: 4,
        borderWidth: 1,
        shadow: false,
        style: { color: "#ffffff", fontSize: "12px" },
        headerFormat: "<b>{point.name}</b><br/>",
        pointFormat: "Cantidad: <span style='color: #60a5fa'>{point.y}</span> ({point.percentage:.1f}%)",
        shared: false
      },
      plotOptions: {
        pie: {
          colors: colors,
          dataLabels: {
            enabled: true,
            format: "{point.percentage:.1f}%",
            style: {
              color: "#1f2937",
              fontSize: "11px",
              fontWeight: "bold",
              textOutline: "none"
            }
          },
          allowPointSelect: true,
          cursor: "pointer"
        }
      },
      legend: { 
        enabled: true,
        layout: "horizontal",
        align: "center",
        verticalAlign: "bottom",
        itemStyle: { color: "#6b7280", fontSize: "12px" }
      },
      credits: { enabled: false },
      series: [
        {
          type: "pie",
          name: "Cantidad",
          data: chartData,
          enableMouseTracking: true
        }
      ]
    };

    return <HighchartsReact highcharts={Highcharts} options={options} />;
  }

  if (type === "line") {
    const series: Highcharts.SeriesOptionsType[] = [
      {
        type: "line",
        name: "Principal",
        data: data.map((d) => d.y),
        color: colors[0],
        marker: {
          radius: 4,
          fillColor: colors[0],
          lineWidth: 2,
          lineColor: "#ffffff"
        }
      }
    ];

    if (compareChartData) {
      series.push({
        type: "line",
        name: "Comparación",
        data: compareData!.map((d) => d.y),
        color: colors[1],
        marker: {
          radius: 4,
          fillColor: colors[1],
          lineWidth: 2,
          lineColor: "#ffffff"
        }
      });
    }

    const options: Highcharts.Options = {
      chart: { 
        type: "line",
        backgroundColor: "transparent",
        style: { fontFamily: "system-ui, -apple-system, sans-serif" }
      },
      title: { text: "" },
      xAxis: {
        categories: data.map((d) => d.name),
        lineWidth: 1,
        lineColor: "#e5e7eb",
        tickColor: "#e5e7eb",
        labels: { style: { color: "#6b7280", fontSize: "12px" } }
      },
      yAxis: {
        title: { text: "" },
        allowDecimals: false,
        gridLineWidth: 1,
        gridLineColor: "#e5e7eb",
        labels: { style: { color: "#6b7280", fontSize: "11px" } }
      },
      legend: { 
        enabled: compareChartData ? true : false,
        itemStyle: { color: "#6b7280", fontSize: "12px" }
      },
      tooltip: {
        backgroundColor: "#111827",
        borderColor: "#374151",
        borderRadius: 4,
        borderWidth: 1,
        shadow: false,
        style: { color: "#ffffff", fontSize: "12px" },
        shared: true
      },
      plotOptions: {
        line: {
          dataLabels: { enabled: false },
          enableMouseTracking: true
        }
      },
      credits: { enabled: false },
      series: series
    };

    return <HighchartsReact highcharts={Highcharts} options={options} />;
  }

  if (type === "area") {
    const series: Highcharts.SeriesOptionsType[] = [
      {
        type: "area",
        name: "Principal",
        data: data.map((d) => d.y),
        color: colors[0],
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1
          },
          stops: [
            [0, colors[0] + "4D"],
            [1, colors[0] + "0D"]
          ]
        },
        marker: {
          radius: 3,
          fillColor: colors[0],
          lineWidth: 1,
          lineColor: "#ffffff"
        }
      }
    ];

    if (compareChartData) {
      series.push({
        type: "area",
        name: "Comparación",
        data: compareData!.map((d) => d.y),
        color: colors[1],
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1
          },
          stops: [
            [0, colors[1] + "4D"],
            [1, colors[1] + "0D"]
          ]
        },
        marker: {
          radius: 3,
          fillColor: colors[1],
          lineWidth: 1,
          lineColor: "#ffffff"
        }
      });
    }

    const options: Highcharts.Options = {
      chart: { 
        type: "area",
        backgroundColor: "transparent",
        style: { fontFamily: "system-ui, -apple-system, sans-serif" }
      },
      title: { text: "" },
      xAxis: {
        categories: data.map((d) => d.name),
        lineWidth: 1,
        lineColor: "#e5e7eb",
        tickColor: "#e5e7eb",
        labels: { style: { color: "#6b7280", fontSize: "12px" } }
      },
      yAxis: {
        title: { text: "" },
        allowDecimals: false,
        gridLineWidth: 1,
        gridLineColor: "#e5e7eb",
        labels: { style: { color: "#6b7280", fontSize: "11px" } }
      },
      legend: { 
        enabled: compareChartData ? true : false,
        itemStyle: { color: "#6b7280", fontSize: "12px" }
      },
      tooltip: {
        backgroundColor: "#111827",
        borderColor: "#374151",
        borderRadius: 4,
        borderWidth: 1,
        shadow: false,
        style: { color: "#ffffff", fontSize: "12px" },
        shared: true
      },
      plotOptions: {
        area: {
          dataLabels: { enabled: false },
          enableMouseTracking: true,
          fillOpacity: 0.3
        }
      },
      credits: { enabled: false },
      series: series
    };

    return <HighchartsReact highcharts={Highcharts} options={options} />;
  }

  if (type === "scatter") {
    const options: Highcharts.Options = {
      chart: { 
        type: "scatter",
        backgroundColor: "transparent",
        style: { fontFamily: "system-ui, -apple-system, sans-serif" }
      },
      title: { text: "" },
      xAxis: {
        categories: data.map((d) => d.name),
        lineWidth: 1,
        lineColor: "#e5e7eb",
        tickColor: "#e5e7eb",
        labels: { style: { color: "#6b7280", fontSize: "12px" } }
      },
      yAxis: {
        title: { text: "" },
        allowDecimals: false,
        gridLineWidth: 1,
        gridLineColor: "#e5e7eb",
        labels: { style: { color: "#6b7280", fontSize: "11px" } }
      },
      legend: { enabled: false },
      tooltip: {
        backgroundColor: "#111827",
        borderColor: "#374151",
        borderRadius: 4,
        borderWidth: 1,
        shadow: false,
        style: { color: "#ffffff", fontSize: "12px" },
        headerFormat: "<b>{point.category}</b><br/>",
        pointFormat: "Valor: <span style='color: #60a5fa'>{point.y}</span>",
        shared: false
      },
      plotOptions: {
        scatter: {
          dataLabels: { enabled: false },
          enableMouseTracking: true,
          marker: {
            radius: 5,
            fillColor: colors[0],
            lineWidth: 1,
            lineColor: "#ffffff",
            states: {
              hover: {
                radius: 7,
                fillColor: colors[0]
              }
            }
          }
        }
      },
      credits: { enabled: false },
      series: [
        {
          type: "scatter",
          name: "Cantidad",
          data: data.map((d) => d.y),
          color: colors[0]
        }
      ]
    };

    return <HighchartsReact highcharts={Highcharts} options={options} />;
  }

  return <div>Tipo de gráfico no soportado</div>;
}

