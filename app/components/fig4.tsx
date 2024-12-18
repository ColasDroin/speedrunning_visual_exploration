"use client";
// Import necessary libraries
import React, { useRef, useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import pako from "pako";

const Page: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  const [option, setOption] = useState<echarts.EChartsOption | null>(null);

  // Function to prepare scatter options
  const prepareGraph = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    let popularityData: any[] = [];

    // Fetch and decompress scatter data
    try {
      const response = await fetch(`${baseUrl}/data/popularity_data.json.gz`);
      const buffer = await response.arrayBuffer();
      const decompressed = pako.inflate(new Uint8Array(buffer), {
        to: "string",
      });
      popularityData = JSON.parse(decompressed);
    } catch (error) {
      console.error("Error fetching scatter data:", error);
      return;
    }

    // Create the new chart option
    const newOption: echarts.EChartsOption = {
      title: {
        text: "Evolution of game popularity with time",
      },

      animation: "auto",
      animationDuration: 1000,
      animationDurationUpdate: 500,
      animationEasing: "cubicInOut",
      animationEasingUpdate: "cubicInOut",
      animationThreshold: 20000,
      progressiveThreshold: 30000,
      progressive: 400,
      hoverLayerThreshold: 30000,
      stateAnimation: {
        duration: 300,
        easing: "cubicOut",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "line",
          lineStyle: {
            color: "rgba(0,0,0,0.2)",
            width: 1,
            type: "solid",
          },
          label: {
            show: true,
            formatter: "{value|YYYY-MM}",
          },
        },
        position: function (point, params, dom, rect, size) {
          const chartWidth = size.viewSize[0];
          const chartHeight = size.viewSize[1];
          const tooltipHeight = size.contentSize[1];
          let x =
            point[0] < chartWidth / 3
              ? chartWidth - size.contentSize[0] - 10
              : 10;
          let y = point[1] - 200;

          // Ensure tooltip does not go below the lower limit of the graph
          if (y + tooltipHeight > chartHeight) {
            y = chartHeight - tooltipHeight - 10;
          }

          // Ensure tooltip does not go above the upper limit of the graph
          if (y < 0) {
            y = 10;
          }

          return [x, y];
        },
      },
      legend: [
        {
          // selectedMode: 'single',
          data: popularityData.games,
        },
      ],
      singleAxis: {
        top: 50,
        bottom: 50,
        axisTick: {
          interval: 1, // Add ticks every month
        },
        axisLabel: {
          formatter: (value: string) =>
            new Date(value).toISOString().slice(0, 7),
        },
        type: "time",
        axisPointer: {
          animation: true,
          label: {
            show: true,
            formatter: (params: any) =>
              new Date(params.value).toISOString().slice(0, 7),
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed",
            opacity: 0.5,
          },
        },
      },
      series: [
        {
          type: "themeRiver",
          emphasis: {
            focus: "series",
            itemStyle: {
              shadowBlur: 20,
              shadowColor: "rgba(0, 0, 0, 0.8)",
            },
            label: {
              show: false, // Hide series labels
            },
          },
          label: {
            show: false, // Hide series labels
          },
          data: popularityData.data,
        },
      ],
    };

    // Update the chart option state
    setOption(newOption);
  };

  // Use effect to prepare options and initialize the chart
  useEffect(() => {
    prepareGraph();
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <ReactECharts
      ref={chartRef}
      option={option || {}} // Render an empty chart initially
      style={{ height: "1000px", width: "100%" }}
      opts={{ renderer: "canvas" }}
      theme="dark"
    />
  );
};

export default Page;
