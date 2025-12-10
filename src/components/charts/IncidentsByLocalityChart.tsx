import * as Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "highcharts/modules/exporting";

type ChartPoint = { name: string; y: number };
type Props = { data: ChartPoint[] };

export function IncidentsByLocalityChart({ data }: Props) {
  if (!data.length) {
    return <div className="text-sm text-gray-500">Sin datos para localidad.</div>;
  }

  const options: Highcharts.Options = {
    chart: { type: "bar" },
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
        type: "bar",
        name: "Incidentes",
        data: data.map((d) => d.y),
      },
    ],
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
