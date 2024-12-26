"use client";

import React, { useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import scatterZelda from "../../public/data/scatter_zelda.json";
type EChartsOption = echarts.EChartsOption;
const Page: React.FC = () => {
  // =============================================================================
  // REFS & STATE
  // =============================================================================
  const chartRef = useRef<ReactECharts | null>(null);

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================
  /**
   * Utility to format seconds into `Hh Mm Ss Msms`
   */
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h}h ${m}m ${s}s ${ms}ms`;
  };

  const createZeldaScatterOption = (): EChartsOption => {
    // ... identical to your code ...
    const optionId = Object.keys(scatterZelda)[0];
    const [dic_per_bin, best_line] = scatterZelda[optionId];

    const l_series = Object.entries(dic_per_bin).map(
      ([bin_id, l_runs]: any) => ({
        type: "scatter",
        dimensions: ["date", "time", "player", "location"],
        data: l_runs,
        dataGroupId: bin_id,
        id: bin_id,
        encode: { x: "date", y: "time" },
        universalTransition: { enabled: true },
        z: 2,
      })
    );

    l_series.push({
      type: "line",
      data: best_line,
      encode: { x: 0, y: 1 },
      universalTransition: { enabled: true },
      animationDuration: 3000,
      symbol: "none",
      tooltip: { show: false },
      z: 1,
    });

    const yValues = best_line.map((item: [string, number]) => item[1]);
    const xValues = best_line.map((item: [string]) =>
      new Date(item[0]).getTime()
    );
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);

    return {
      id: optionId,
      title: {
        text: "Speedrun times for category 100% of game TheLegendofZelda: Breath of the Wild",
      },
      dataZoom: [
        {
          type: "inside",
          yAxisIndex: [0],
          filterMode: "filter",
          startValue: yMin,
          endValue: yMax,
        },
        {
          type: "inside",
          xAxisIndex: [0],
          startValue: Math.max(xMin, new Date("2012-02-01").getTime()),
          endValue: xMax,
          filterMode: "filter",
        },
      ],
      tooltip: {
        trigger: "item",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          return [
            "Date: " + params.data[0],
            "Run time: " + formatTime(params.data[1]),
            "Player: " + params.data[2],
            "Location: " + params.data[3],
          ].join("<br/>");
        },
      },
      grid: { left: 200 },
      yAxis: {
        type: "time",
        name: "Speedrun time",
        axisLabel: {
          formatter: (value: string) => {
            const timeInSeconds = new Date(value).getTime() / 1000;
            return formatTime(timeInSeconds);
          },
        },
      },
      xAxis: {
        type: "time",
        name: "Date",
      },
      animationDurationUpdate: 1000,
      animationThreshold: 20000,
      progressive: 20000,
      progressiveThreshold: 20000,
      series: l_series,
      graphic: [
        {
          type: "text",
          left: 50,
          top: 20,
          style: {
            text: "Back",
            fontSize: 18,
            fill: "grey",
          },
        },
      ],
    };
  };

  const defaultZeldaOption = createZeldaScatterOption();

  return (
    <ReactECharts
      ref={chartRef}
      option={defaultZeldaOption}
      style={{ height: "800px", width: "100%" }}
      opts={{ renderer: "canvas" }}
      theme="light"
    />
  );
};

export default Page;
