import Highcharts from "highcharts";

Highcharts.setOptions({
  colors: [
    "#1E3A8A", // Azul oscuro
    "#2563EB", // Azul intenso
    "#0EA5E9", // Azul claro
    "#F97316", // Naranja fuerte
    "#FB923C", // Naranja claro
    "#64748B", // Gris azulado
  ],

  chart: {
    backgroundColor: "transparent",
    style: {
      fontFamily: "Inter, sans-serif"
    }
  },

  title: {
    style: {
      color: "#1F2933",
      fontWeight: "600"
    }
  },

  xAxis: {
    labels: { style: { color: "#475569" } },
    title: { style: { color: "#475569" } }
  },

  yAxis: {
    labels: { style: { color: "#475569" } },
    title: { style: { color: "#475569" } }
  },

  legend: {
    itemStyle: {
      color: "#1F2933"
    }
  }
});
