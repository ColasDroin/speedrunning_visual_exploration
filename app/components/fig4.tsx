"use client";

import React, { useRef, useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import flagData from "../../public/data/flag_data.json";
import worldJson from "../../public/data/world_map.json";
import pako from "pako";

echarts.registerMap("WORLD", worldJson);

interface Flag {
  name: string;
  emoji: string;
}

function getFlag(countryCode: string) {
  if (!countryCode) return "";
  return (flagData.find((item) => item.code === countryCode) || {}).emoji;
}

const updateFrequency = 500;

const Page: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  const [option, setOption] = useState<echarts.EChartsOption | null>(null);

  const prepareGraph = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    let raceData: any[] = [];

    try {
      const response = await fetch(`${baseUrl}/data/race_data.json.gz`);
      const buffer = await response.arrayBuffer();
      const decompressed = pako.inflate(new Uint8Array(buffer), {
        to: "string",
      });
      raceData = JSON.parse(decompressed);
    } catch (error) {
      console.error("Error fetching scatter data:", error);
      return;
    }

    const data = raceData.data;
    const yearMonth: string[] = [...new Set(data.map((d: string[]) => d[0]))];
    const startIndex = yearMonth.length - 4;
    const startMonth = yearMonth[startIndex];
    const endMonth = yearMonth[yearMonth.length - 1];

    // Find max value for consistent visualMap scaling
    const maxValue = Math.max(...data.map((d: string[]) => parseFloat(d[2])));

    // Bar race option
    const barOption: echarts.EChartsOption = {
      grid: {
        top: 10,
        bottom: 30,
        left: 150,
        right: 80,
      },
      xAxis: {
        max: "dataMax",
        axisLabel: {
          formatter: (n: number) => Math.round(n).toString(),
        },
      },
      yAxis: {
        type: "category",
        inverse: true,
        max: 10,
        axisLabel: {
          show: true,
          fontSize: 14,
          formatter: (value: any) => value + "{flag|" + getFlag(value) + "}",
          rich: {
            flag: {
              fontSize: 25,
              padding: 5,
            },
          },
        },
        animationDuration: 300,
        animationDurationUpdate: 300,
      },
      dataset: {
        source: data.filter((d: string[]) => d[0] === startMonth),
      },
      series: [
        {
          realtimeSort: true,
          seriesLayoutBy: "column",
          type: "bar",
          itemStyle: {
            color: (params: any) => params.data[3],
          },
          encode: {
            x: 2,
            y: 1,
          },
          label: {
            show: true,
            precision: 1,
            position: "right",
            valueAnimation: true,
            fontFamily: "monospace",
          },
        },
      ],
      animationDuration: 0,
      animationDurationUpdate: updateFrequency,
      animationEasing: "linear",
      animationEasingUpdate: "linear",
      graphic: {
        elements: [
          {
            type: "text",
            right: 160,
            bottom: 60,
            style: {
              text: startMonth,
              font: "bolder 80px monospace",
              fill: "rgba(100, 100, 100, 0.25)",
            },
            z: 100,
          },
        ],
      },
    };

    // Map option
    const mapOption: echarts.EChartsOption = {
      backgroundColor: "#000",
      title: {
        text: endMonth,
        left: "center",
        top: "top",
        textStyle: {
          color: "#fff",
          fontSize: 24,
        },
      },
      tooltip: {
        trigger: "item",
        formatter: function (params: any) {
          console.log(params);
          return `${params.name}: ${params.value}`;
        },
      },
      visualMap: [
        {
          type: "continuous",
          min: 0,
          max: maxValue,
          text: ["High", "Low"],
          left: "right",
          inRange: {
            color: [
              "#313695",
              "#4575b4",
              "#74add1",
              "#abd9e9",
              "#e0f3f8",
              "#ffffbf",
              "#fee090",
              "#fdae61",
              "#f46d43",
              "#d73027",
              "#a50026",
            ].reverse(),
          },
          calculable: false,
        },
      ],
      series: [
        {
          name: "World Map",
          type: "map",
          map: "WORLD",
          roam: true,

          data: data
            .filter((d: string[]) => d[0] === endMonth)
            .map((d: string[]) => ({
              name: d[1], // Assuming the country name is at index 1
              value: parseFloat(d[2]), // Assuming the score is at index 2
            })),
          // emphasis: {
          //   label: {
          //     show: true,
          //   },
          //   itemStyle: {
          //     areaColor: "#ff0",
          //   },
          // },
          // select: {
          //   label: {
          //     show: true,
          //     color: "#fff",
          //   },
          // },
          animation: true,
          animationDurationUpdate: 1000,
          animationEasingUpdate: "cubicInOut",
          label: {
            show: false,
          },
        },
      ],
    };

    setOption(barOption);

    // Update function for the race
    const updateYear = (year: string) => {
      const source = data.filter((d: string[]) => d[0] === year);

      if (year === endMonth) {
        // Fade out the bar chart
        setOption((prevOption) => ({
          ...prevOption,
          series: [
            {
              ...prevOption.series[0],
              animationDuration: 200,
              itemStyle: {
                opacity: 0,
              },
            },
          ],
          yAxis: {
            ...prevOption.yAxis,
            show: false,
            animationDuration: 200,
          },
          xAxis: {
            show: false,
            animationDuration: 200,
          },
        }));

        // Switch to map with animation
        setTimeout(() => {
          const chartInstance = chartRef.current?.getEchartsInstance();
          if (chartInstance) {
            chartInstance.clear();
            chartInstance.setOption(mapOption, {
              notMerge: true,
              replaceMerge: ["series"],
              animation: true,
              animationDuration: 1000,
              animationEasing: "cubicInOut",
            });
          }
        }, 300);
      } else {
        setOption((prevOption) => ({
          ...prevOption,
          dataset: { source },
          graphic: {
            elements: [
              {
                ...prevOption.graphic.elements[0],
                style: { ...prevOption.graphic.elements[0].style, text: year },
              },
            ],
          },
        }));
      }
    };

    // Schedule updates
    for (let i = startIndex; i < yearMonth.length - 1; ++i) {
      setTimeout(
        () => updateYear(yearMonth[i + 1]),
        (i - startIndex) * updateFrequency
      );
    }
  };

  useEffect(() => {
    prepareGraph();
  }, []);

  return (
    <ReactECharts
      ref={chartRef}
      option={option || {}}
      style={{ height: "1000px", width: "100%" }}
      opts={{ renderer: "canvas" }}
      theme="dark"
    />
  );
};

export default Page;
