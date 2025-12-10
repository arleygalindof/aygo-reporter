import * as Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "highcharts/modules/exporting";

type ChartPoint = { name: string; y: number };
type Props = { data: ChartPoint[] };

export function IncidentsByTypeChart({ data }: Props) {
  if (!data.length) {
    return <div className="text-sm text-gray-500">Sin datos para tipo de incidente.</div>;
  }

  const options: Highcharts.Options = {
    chart: { type: "column" },
    title: { text: "" },
    xAxis: {
      categories: data.map((d) => d.name),
    },
    yAxis: {
      title: { text: "Cantidad" },
      allowDecimals: false,
    },
    series: [
      {
        type: "column",
        name: "Incidentes",
        data: data.map((d) => d.y),
      },
    ],
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
