// src/components/charts/DynamicChart.tsx
import * as Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import type { ChartDefinition, DataPoint } from "../../types/reporte"; // Importa los tipos

type DynamicChartProps = {
  chartDef: ChartDefinition; // La definición de qué tipo de gráfico y qué ejes usar
  data: DataPoint[]; // Los datos a graficar
};

export function DynamicChart({ chartDef, data }: DynamicChartProps) {
  // 1. Preprocesamiento de datos a formato Highcharts
  const categories = data.map(item => item[chartDef.x]); // Valores para el eje X
  const seriesData = data.map(item => item[chartDef.y]); // Valores para el eje Y

  // 2. Definición de Opciones de Highcharts
  const options: Highcharts.Options = {
    chart: { 
      type: chartDef.tipo === 'bar' ? 'column' : chartDef.tipo, // 'bar' para Highcharts es 'column' (vertical)
    },
    title: { text: chartDef.titulo },
    
    // Configuración de Ejes Dinámicos
    xAxis: {
      categories: categories,
      title: { text: chartDef.x.charAt(0).toUpperCase() + chartDef.x.slice(1) }, // Capitalizar el título del eje
    },
    yAxis: {
      title: { text: chartDef.y.charAt(0).toUpperCase() + chartDef.y.slice(1) },
    },
    
    series: [
      {
        type: chartDef.tipo === 'bar' ? 'column' : chartDef.tipo,
        name: chartDef.y,
        data: seriesData,
      },
    ],
    
    // Ocultar la leyenda si solo hay una serie
    legend: { enabled: false },

    // Habilitar exportación
    exporting: { enabled: true },
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}