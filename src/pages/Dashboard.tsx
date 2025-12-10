
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

interface ReporterStats {
  totalCategories: number;
  totalReports: number;
  publicReports: number;
  privateReports: number;
  totalRows: number;
  reportsByCategory: Record<string, number>;
  availableColumns?: string[];
}

interface ColumnAnalysis {
  columnName: string;
  valueCounts: Record<string, number>;
  totalValues: number;
  uniqueValues: number;
   totalUniqueValues: number;
   isLimited: boolean;
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-600">
      <h3 className="text-gray-600 text-sm font-semibold mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<ReporterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [chartType, setChartType] = useState<"bar" | "pie" | "line">("bar");
  const [columnAnalysis, setColumnAnalysis] = useState<ColumnAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // userId puede venir como 'userId' o 'id' dependiendo del endpoint
      const userId = parsedUser.userId || parsedUser.id;
      if (userId) {
        fetchStats(userId);
      } else {
        console.error("No userId found in user data");
        setLoading(false);
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchStats = async (userId: number) => {
    try {
      // Intentar con API Gateway primero (puerto 8000) -> Report Service
      let response = await fetch(
        `http://localhost:8000/api/reports/csv/stats/${userId}`
      ).catch(() => null);

      // Si el gateway falla o devuelve status no-ok, intentar directo al servicio
      if (!response || !response.ok) {
        response = await fetch(`http://localhost:2084/api/reports/csv/stats/${userId}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        
        // Solo establecer la columna por defecto, NO cargar el análisis automáticamente
        if (data.availableColumns && data.availableColumns.length > 0) {
          const firstColumn = data.availableColumns[0];
          setSelectedColumn(firstColumn);
        }
      } else {
        console.warn("Stats endpoint returned non-ok status:", response?.status);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchColumnAnalysis = async (userId: number, column: string) => {
    setLoadingAnalysis(true);
    try {
      let response = await fetch(
        `http://localhost:8000/api/reports/csv/analysis/${userId}?column=${encodeURIComponent(column)}`
      ).catch(() => null);

      // Fallback si gateway falla o retorna no-ok
      if (!response || !response.ok) {
        response = await fetch(`http://localhost:2084/api/reports/csv/analysis/${userId}?column=${encodeURIComponent(column)}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        setColumnAnalysis(data);
      } else {
        console.warn("Analysis endpoint returned non-ok status:", response?.status);
        setColumnAnalysis(null);
      }
    } catch (error) {
      console.error("Error fetching column analysis:", error);
      setColumnAnalysis(null);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleColumnChange = (column: string) => {
    setSelectedColumn(column);
     // Limpiar el análisis anterior cuando se cambia de columna
     setColumnAnalysis(null);
  };

  const handleChartTypeChange = (type: "bar" | "pie" | "line") => {
    setChartType(type);
  };

  const getCategoryChartOptions = () => {
    if (!stats || Object.keys(stats.reportsByCategory).length === 0) {
      return {
        chart: { type: "bar" },
        title: { text: "Reportes por Categoría" },
        xAxis: { categories: [] },
        yAxis: { title: { text: "Cantidad" } },
        series: [{ name: "Reportes", data: [] }],
        legend: { enabled: false },
      };
    }

    const categories = Object.keys(stats.reportsByCategory);
    const data = Object.values(stats.reportsByCategory);

    return {
      chart: { type: "bar" },
      title: { text: "Reportes por Categoría" },
      xAxis: {
        categories: categories,
        title: { text: "Categoría" },
      },
      yAxis: {
        title: { text: "Cantidad de Reportes" },
      },
      series: [
        {
          name: "Reportes",
          data: data,
          color: "#3b82f6",
        },
      ],
      legend: { enabled: false },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true,
          },
        },
      },
    };
  };

  const getPublicPrivateChartOptions = () => {
    if (!stats) {
      return {
        chart: { type: "pie" },
        title: { text: "Reportes Públicos vs Privados" },
        series: [{ data: [] }],
      };
    }

    return {
      chart: { type: "pie" },
      title: { text: "Estado de Reportes" },
      series: [
        {
          name: "Reportes",
          data: [
            {
              name: `Públicos (${stats.publicReports})`,
              y: stats.publicReports,
              color: "#10b981",
            },
            {
              name: `Privados (${stats.privateReports})`,
              y: stats.privateReports,
              color: "#ef4444",
            },
          ],
        },
      ],
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: "pointer",
          dataLabels: {
            enabled: true,
            format: "<b>{point.name}</b>: {point.percentage:.1f}%",
            style: {
              color: "#1f2937",
              textOutline: "none"
            }
          },
        },
      },
    };
  };

  const getDynamicChartOptions = () => {
    if (!columnAnalysis || Object.keys(columnAnalysis.valueCounts).length === 0) {
      return {
        chart: { type: chartType },
        title: { text: selectedColumn ? `Análisis de ${selectedColumn}` : "Seleccione una columna" },
        series: [{ data: [] }],
      };
    }

    const categories = Object.keys(columnAnalysis.valueCounts);
    const values = Object.values(columnAnalysis.valueCounts);

    if (chartType === "pie") {
      return {
        chart: { type: "pie" },
        title: { text: `Distribución de ${columnAnalysis.columnName}` },
        series: [
          {
            name: "Cantidad",
            data: categories.map((cat, idx) => ({
              name: cat,
              y: values[idx],
            })),
          },
        ],
        plotOptions: {
          pie: {
            allowPointSelect: true,
            cursor: "pointer",
            dataLabels: {
              enabled: true,
              format: "<b>{point.name}</b>: {point.percentage:.1f}%",
              style: {
                color: "#1f2937",
                textOutline: "none"
              }
            },
          },
        },
      };
    }

    // bar o line
    return {
      chart: { type: chartType },
      title: { text: `Análisis de ${columnAnalysis.columnName}` },
      xAxis: {
        categories: categories,
        title: { text: columnAnalysis.columnName },
      },
      yAxis: {
        title: { text: "Cantidad" },
      },
      series: [
        {
          name: "Cantidad",
          data: values,
          color: "#3b82f6",
        },
      ],
      legend: { enabled: false },
      plotOptions: {
        [chartType]: {
          dataLabels: {
            enabled: true,
          },
        },
      },
    };
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reporteador de Datos</h1>
          {user && (
            <p className="text-gray-600 text-sm mt-1">
              Bienvenido, {user.name}
            </p>
          )}
        </div>

        <div className="flex gap-4 items-center">
          <span className="text-xl font-semibold text-gray-600">
            {new Date().toLocaleDateString("es-CO", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Cargando estadísticas...</p>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card
              title="Categorías Creadas"
              value={stats.totalCategories}
            />
            <Card title="Total de Reportes" value={stats.totalReports} />
            <Card title="Reportes Públicos" value={stats.publicReports} />
            <Card title="Reportes Privados" value={stats.privateReports} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-6">
              <HighchartsReact
                highcharts={Highcharts}
                options={getCategoryChartOptions()}
              />
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <HighchartsReact
                highcharts={Highcharts}
                options={getPublicPrivateChartOptions()}
              />
            </div>
          </div>

          {/* Sección de análisis dinámico */}
          {stats.availableColumns && stats.availableColumns.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Análisis Dinámico</h2>
              
              <div className="flex gap-4 mb-6 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Columna a analizar
                  </label>
                  <select
                    value={selectedColumn}
                    onChange={(e) => handleColumnChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {stats.availableColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de gráfico
                  </label>
                  <select
                    value={chartType}
                    onChange={(e) => handleChartTypeChange(e.target.value as "bar" | "pie" | "line")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="bar">Barras</option>
                    <option value="pie">Circular</option>
                    <option value="line">Líneas</option>
                  </select>
                </div>

                 <div className="flex items-end">
                   <button
                     onClick={() => {
                       if (user) {
                         const userId = user.userId || user.id;
                         fetchColumnAnalysis(userId, selectedColumn);
                       }
                     }}
                     disabled={!selectedColumn || loadingAnalysis}
                     className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                   >
                     {loadingAnalysis ? "Analizando..." : "Analizar"}
                   </button>
                 </div>
              </div>

              {loadingAnalysis ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : columnAnalysis ? (
                <div>
                  <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 font-semibold">Total de valores</p>
                      <p className="text-lg font-bold text-gray-800">{columnAnalysis.totalValues.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 font-semibold">Valores únicos</p>
                       <p className="text-lg font-bold text-blue-600">
                         {columnAnalysis.uniqueValues.toLocaleString()}
                         {columnAnalysis.isLimited && (
                           <span className="text-xs text-gray-500 ml-1">(Top 20 de {columnAnalysis.totalUniqueValues})</span>
                         )}
                       </p>
                    </div>
                  </div>
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={getDynamicChartOptions()}
                  />
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                   Selecciona una columna y haz clic en "Analizar" para ver el gráfico
                </p>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">
              Información General
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm font-semibold">
                  Total de Filas Procesadas
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalRows.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold">
                  Tasa de Disponibilidad
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {(
                    (stats.publicReports / stats.totalReports) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-600">
          No hay datos disponibles. Comienzo a subir reportes para ver estadísticas.
        </p>
      )}
    </>
  );
}
