"use client";

import React, { useRef, useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import scatterZelda from "../../public/data/scatter_zelda.json";
type EChartsOption = echarts.EChartsOption;

const Page: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  const [showBestLine, setShowBestLine] = useState(false);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h}h ${m}m ${s}s ${ms}ms`;
  };

  const createZeldaScatterOption = (showBestLine: boolean): EChartsOption => {
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

    if (showBestLine) {
      l_series.push({
        type: "line",
        data: best_line,
        encode: { x: 0, y: 1 },
        universalTransition: { enabled: true },
        animationDuration: 5000,
        symbol: "none",
        tooltip: { show: false },
        z: 1,
      });
    }

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
        type: "value",
        name: "Speedrun time",
        axisLabel: {
          formatter: (value: number) => formatTime(value),
        },
        min: yMin,
        max: yMax,
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
    };
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShowBestLine(true);
          }
        });
      },
      { threshold: 0.5 } // Trigger when 50% of the chart is visible
    );

    if (chartRef.current) {
      observer.observe(chartRef.current.getEchartsInstance().getDom());
    }

    return () => {
      if (chartRef.current) {
        observer.unobserve(chartRef.current.getEchartsInstance().getDom());
      }
    };
  }, []);

  const defaultZeldaOption = createZeldaScatterOption(showBestLine);

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
