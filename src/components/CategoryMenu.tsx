import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Folder, FileText, RefreshCw, AlertTriangle } from "lucide-react";

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

export default function CategoryMenu() {
  const [categories, setCategories] = useState<CategoriesData>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [usedUserId, setUsedUserId] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchCategories = useCallback(async () => {
    try {
      setError("");
      const candidates: number[] = [];

      // 1) userId guardado en localStorage.user (si existe)
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

      // 2) fallback comunes (1 y 17) para entornos demo donde userId no está en el front
      candidates.push(1);
      candidates.push(17);

      let loaded = false;
      for (const candidate of candidates) {
        const response = await fetch(`http://localhost:2084/api/reports/csv/categories/${candidate}`);
        if (!response.ok) continue;
        const data = await response.json();
        // Si encontramos datos (o incluso vacíos pero el backend respondió), tomamos este userId
        setCategories(data);
        setUsedUserId(candidate);
        loaded = true;
        // Si hay datos, cortamos; si está vacío probamos el siguiente solo si era 1
        if (Object.keys(data).length > 0 || candidate !== 1) {
          break;
        }
      }

      if (!loaded) {
        setError("No se pudieron cargar las categorías");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("No se pudieron cargar las categorías");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const handler = () => fetchCategories();
    window.addEventListener("csv:refreshCategories", handler);
    return () => window.removeEventListener("csv:refreshCategories", handler);
  }, [fetchCategories]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleReportClick = (reportId: string) => {
    navigate(`/dashboard/report/${reportId}`);
  };

  if (loading) {
    return (
      <div className="px-4 py-2 text-sm text-white/70">
        Cargando categorías...
      </div>
    );
  }

  const isEmpty = Object.keys(categories).length === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-4 text-xs text-white/70">
        <span>{error ? "Error al cargar" : ""}</span>
        <button
          onClick={fetchCategories}
          className="flex items-center gap-1 text-white/80 hover:text-white transition text-xs"
        >
          <RefreshCw size={14} />
          Recargar
        </button>
      </div>

      {error && (
        <div className="mx-4 bg-red-500/20 border border-red-500/40 text-red-100 text-xs rounded px-3 py-2 flex items-center gap-2">
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}

      {usedUserId && !error && (
        <div className="px-4 text-[11px] text-white/50">
          Mostrando categorías del usuario ID {usedUserId}
        </div>
      )}

      {isEmpty && !error && (
        <div className="px-4 py-2 text-sm text-white/70">
          No hay reportes cargados
        </div>
      )}

      {!isEmpty && (
        <div className="space-y-1">
          {Object.entries(categories).map(([category, periods]) => (
            <div key={category}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center gap-2 px-4 py-2 rounded hover:bg-white/10 transition text-left"
                title={category}
              >
                {expandedCategories.has(category) ? (
                  <ChevronDown size={16} className="flex-shrink-0" />
                ) : (
                  <ChevronRight size={16} className="flex-shrink-0" />
                )}
                <Folder size={16} className="flex-shrink-0" />
                <span className="text-sm truncate">{category}</span>
                <span className="ml-auto text-xs text-white/50">{periods.length}</span>
              </button>

              {/* Period Items */}
              {expandedCategories.has(category) && (
                <div className="ml-8 space-y-1 mt-1">
                  {periods.map((periodInfo) => (
                    <button
                      key={periodInfo.reportId}
                      onClick={() => handleReportClick(periodInfo.reportId)}
                      className="w-full flex items-center gap-2 px-4 py-2 rounded hover:bg-white/10 transition text-left group overflow-hidden"
                    >
                      <FileText size={14} className="flex-shrink-0 text-white/70 group-hover:text-white" />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-xs font-medium truncate whitespace-nowrap overflow-hidden text-ellipsis" title={periodInfo.period}>{periodInfo.period}</p>
                        <p className="text-xs text-white/50 truncate whitespace-nowrap overflow-hidden text-ellipsis" title={periodInfo.fileName}>{periodInfo.fileName}</p>
                      </div>
                      <span className="text-xs text-white/50 flex-shrink-0">{periodInfo.rowCount}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
