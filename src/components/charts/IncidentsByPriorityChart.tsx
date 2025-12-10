import * as Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "highcharts/modules/exporting";

type ChartPoint = { name: string; y: number };
type Props = { data: ChartPoint[] };

export function IncidentsByPriorityChart({ data }: Props) {
  if (!data.length) {
    return <div className="text-sm text-gray-500">Sin datos para prioridad.</div>;
  }

  const options: Highcharts.Options = {
    chart: { type: "pie" },
    title: { text: "" },
    plotOptions: {
      pie: {
        innerSize: "60%",
      },
    },
    series: [
      {
        type: "pie",
        data,
      },
    ],
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
