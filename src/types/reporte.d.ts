// src/types/reporte.d.ts

export type ChartType = "line" | "bar" | "pie"; // Define los tipos de gráficos compatibles

export type ChartDefinition = {
  tipo: ChartType;
  x: string; // Etiqueta para el eje X (o la categoría)
  y: string; // Etiqueta para el eje Y (o el valor)
  titulo: string;
};

export type DataPoint = {
  [key: string]: any; // Permite cualquier clave (fecha, localidad, etc.) con cualquier valor
};

export type ReporteData = {
  graficas_recomendadas: ChartDefinition[];
  insights: string[];
  datos: {
    [titulo: string]: DataPoint[]; // Un mapa donde la clave es el título del gráfico y el valor es un array de puntos de datos
  };
};

// Datos de ejemplo para simular la API
export const DUMMY_REPORT_DATA: ReporteData = {
  graficas_recomendadas: [
    { tipo: "line", x: "fecha", y: "total_incidentes", titulo: "Tendencia temporal de eventos" },
    { tipo: "bar", x: "localidad", y: "cantidad", titulo: "Eventos por localidad" },
  ],
  insights: [
    "La mayor concentración de eventos ocurre entre las 6pm y 9pm",
    "Las localidades con más incidentes son Kennedy y Suba",
  ],
  datos: {
    "Tendencia temporal de eventos": [
      { fecha: "2025-11-01", total_incidentes: 12 },
      { fecha: "2025-11-02", total_incidentes: 18 },
      { fecha: "2025-11-03", total_incidentes: 25 },
      { fecha: "2025-11-04", total_incidentes: 22 },
      { fecha: "2025-11-05", total_incidentes: 30 },
      // ... más datos
    ],
    "Eventos por localidad": [
      { localidad: "Kennedy", cantidad: 120 },
      { localidad: "Suba", cantidad: 95 },
      { localidad: "Chapinero", cantidad: 40 },
      { localidad: "Bosa", cantidad: 60 },
    ],
  },
};