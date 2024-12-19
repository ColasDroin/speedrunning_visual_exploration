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
  const updateFunctionsRef = useRef<Function[]>([]);

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
    const startIndex = 12;
    const startMonth = yearMonth[startIndex];
    const endMonth = yearMonth[yearMonth.length - 1];

    const maxValue = Math.max(...data.map((d: string[]) => parseFloat(d[2])));

    // Map option
    const mapOption: echarts.EChartsOption = {
      // backgroundColor: "#000",
      // title: {
      //   text: endMonth,
      //   left: "center",
      //   top: "top",
      //   textStyle: {
      //     color: "#fff",
      //     fontSize: 24,
      //   },
      // },
      tooltip: {
        trigger: "item",
        formatter: function (params: any) {
          return `Score of ${params.data.full_name}: ${params.value}`;
        },
      },
      visualMap: [
        {
          type: "continuous",
          min: 0,
          max: maxValue,
          text: ["High", "Low"],
          orient: "horizontal",
          left: "center",
          // left: "right",
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
          id: "race_score",
          name: "World Map",
          type: "map",
          map: "WORLD",
          roam: false,
          data: data
            .filter((d: string[]) => d[0] === endMonth)
            .map((d: string[]) => ({
              name: d[1],
              value: parseFloat(d[2]),
              full_name: d[4],
            })),
          animation: true,
          animationDurationUpdate: 2000,
          animationEasingUpdate: "cubicInOut",
          universalTransition: true,
          label: {
            show: false,
          },
        },
      ],
    };

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
        max: 20,
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
        data: data
          .filter((d: string[]) => d[0] === startMonth)
          .map(function (item) {
            return item[1];
          }),
      },
      dataset: {
        source: data.filter((d: string[]) => d[0] === startMonth),
        dimensions: ["month", "name", "value", "color"],
      },
      series: [
        {
          realtimeSort: true,
          seriesLayoutBy: "column",
          id: "race_score",
          type: "bar",
          itemStyle: {
            color: (params: any) => params.data[3],
          },
          encode: {
            x: "value",
            y: "name",
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
      universalTransition: true,
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
          {
            type: "rect",
            right: "10%",
            bottom: "50%",
            z: 110,
            shape: {
              width: 100,
              height: 40,
            },
            style: {
              fill: "#007BFF",
              stroke: "#0056b3",
              lineWidth: 1,
              shadowBlur: 2,
              shadowColor: "rgba(0,0,0,0.3)",
              shadowOffsetX: 1,
              shadowOffsetY: 1,
              text: "Skip to Map",
              fontSize: 14,
              textFill: "#ffffff",
              textAlign: "center",
              textVerticalAlign: "middle",
              cursor: "pointer",
            },
            onclick: function () {
              // Clear all pending timeouts
              updateFunctionsRef.current.forEach((updateFn) => updateFn());

              // Update directly to the last month's data
              const source = data.filter((d: string[]) => d[0] === endMonth);
              setOption((prevOption) => ({
                ...prevOption,
                dataset: { source },
                graphic: {
                  elements: [
                    {
                      ...prevOption?.graphic?.elements[0],
                      style: {
                        ...prevOption?.graphic?.elements[0]?.style,
                        text: endMonth,
                      },
                    },
                    prevOption?.graphic?.elements[1],
                  ],
                },
              }));

              // After a short delay, switch to the map
              setTimeout(() => {
                const chartInstance = chartRef.current?.getEchartsInstance();
                if (chartInstance) {
                  chartInstance.setOption(mapOption, { notMerge: true });
                }
              }, updateFrequency);
            },
          },
        ],
      },
    };

    setOption(barOption);

    // Update function for the race
    const updateYear = (year: string) => {
      if (year === endMonth) {
        const chartInstance = chartRef.current?.getEchartsInstance();
        if (chartInstance) {
          setTimeout(() => {
            chartInstance.setOption(mapOption, { notMerge: true });
          }, updateFrequency);
        }
      }

      setOption((prevOption) => ({
        ...prevOption,
        dataset: { source: data.filter((d: string[]) => d[0] === year) },
        graphic: {
          elements: [
            {
              ...prevOption?.graphic?.elements[0],
              style: {
                ...prevOption?.graphic?.elements[0]?.style,
                text: year,
              },
            },
            prevOption?.graphic?.elements[1],
          ],
        },
      }));
    };

    // Store update functions in ref for cleanup
    const updates: Function[] = [];
    for (let i = startIndex; i < yearMonth.length - 1; ++i) {
      const timeoutId = setTimeout(
        () => updateYear(yearMonth[i + 1]),
        (i - startIndex) * updateFrequency
      );
      updates.push(() => clearTimeout(timeoutId));
    }
    updateFunctionsRef.current = updates;
  };

  useEffect(() => {
    prepareGraph();
    return () => {
      // Cleanup timeouts when component unmounts
      updateFunctionsRef.current.forEach((updateFn) => updateFn());
    };
  }, []);

  return (
    <ReactECharts
      ref={chartRef}
      option={option || {}}
      style={{ height: "800px", width: "100%" }}
      opts={{ renderer: "canvas" }}
      theme="dark"
    />
  );
};

export default Page;
