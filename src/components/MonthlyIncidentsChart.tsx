import * as Highcharts from "highcharts"; // <--- Crucial change for TypeScript
import HighchartsReact from "highcharts-react-official";
import 'highcharts/modules/exporting'; // <--- The module is loaded for its side effects

export default function MonthlyIncidentsChart() {
  // Datos simulados (por ahora, luego los traes del backend)
  const options: Highcharts.Options = {
    chart: {
      type: "line",
    },

    title: {
      text: "Incidentes por día del mes",
    },

    subtitle: {
      text: "Datos simulados - Emergencias 123",
    },

    xAxis: {
      categories: [
        "1","2","3","4","5","6","7","8","9","10",
        "11","12","13","14","15","16","17","18","19","20",
        "21","22","23","24","25","26","27","28","29","30"
      ],
      title: {
        text: "Día del mes",
      },
    },

    yAxis: {
      title: {
        text: "Número de incidentes",
      },
    },

    tooltip: {
      shared: true,
      valueSuffix: " incidentes",
    },

    exporting: {
      enabled: true,
      buttons: {
        contextButton: {
          menuItems: [
            "downloadPNG",
            "downloadJPEG",
            "downloadSVG",
          ],
        },
      },
    },

    series: [
      {
        name: "Incidentes",
        type: "line",
        data: [
          12, 18, 25, 20, 22, 30, 28, 35, 40, 38,
          36, 44, 50, 48, 46, 42, 39, 41, 45, 47,
          49, 53, 55, 60, 58, 57, 54, 50, 48, 45
        ],
      },
    ],
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
