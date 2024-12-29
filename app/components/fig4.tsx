"use client";

import React, { useRef, useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import flagData from "../../public/data/flag_data.json";
// import worldJson from "../../public/data/world_map.json";
import pako from "pako";

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

  let isSmallScreen = false;
  if (typeof window !== "undefined") {
    isSmallScreen = window.innerWidth < 768;
  } else {
    console.error("Window object is not available.");
  }
  const fontSize = isSmallScreen ? 12 : 18;

  const prepareGraph = async (startAnimation = false) => {
    const baseUrl = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}`;
    let raceData: any[] = [];
    let worldJson: any = {};

    try {
      const response = await fetch(`${baseUrl}/data/race_data.json.gz`);
      const buffer = await response.arrayBuffer();
      const decompressed = pako.inflate(new Uint8Array(buffer), {
        to: "string",
      });
      raceData = JSON.parse(decompressed);

      const responseWorld = await fetch(`${baseUrl}/data/world_map.json.gz`);
      const bufferWorld = await responseWorld.arrayBuffer();
      const decompressedWorld = pako.inflate(new Uint8Array(bufferWorld), {
        to: "string",
      });
      worldJson = JSON.parse(decompressedWorld);
      echarts.registerMap("WORLD", worldJson);
    } catch (error) {
      console.error("Error fetching scatter data:", error);
      return;
    }

    const data = raceData.data;
    const yearMonth: string[] = [...new Set(data.map((d: string[]) => d[0]))];
    const startIndex = 0;
    const startMonth = yearMonth[startIndex];
    const endMonth = yearMonth[yearMonth.length - 1];

    const maxValue = Math.max(...data.map((d: string[]) => parseFloat(d[2])));

    const mapOption: echarts.EChartsOption = {
      backgroundColor: "transparent",
      title: {
        text: "World map of scores in November 2023",
        left: "center",
        top: 20,
        textStyle: { color: "white", fontSize: fontSize },
      },
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
      graphic: {
        elements: [
          {
            type: "group",
            right: "40%",
            bottom: "10%",
            z: 110,
            children: [
              {
                type: "rect",
                shape: {
                  width: 140,
                  height: 40,
                },
                left: "center",
                top: "center",
                style: {
                  fill: "#28a745",
                  stroke: "#19692c",
                  lineWidth: 1,
                  shadowBlur: 2,
                  shadowColor: "rgba(0,0,0,0.3)",
                  shadowOffsetX: 1,
                  shadowOffsetY: 1,
                  cursor: "pointer",
                  z: 109,
                },
              },
              {
                type: "text",
                style: {
                  text: "Restart race",
                  fontSize: 14,
                  fontWeight: "bold",
                  fill: "#FFFFFF",
                  textAlign: "center",
                  textVerticalAlign: "middle",
                  cursor: "pointer",
                  z: 110,
                },
              },
            ],
            onclick: function () {
              // Clear all pending timeouts
              updateFunctionsRef.current.forEach((updateFn) => updateFn());

              // Restart the bar race with proper animations
              const chartInstance = chartRef.current?.getEchartsInstance();
              // Get mapOption and log it
              const mapOptionCurrent = chartInstance?.getOption();
              if (chartInstance) {
                const barOptionWithTransition = {
                  ...barOption,
                  dataset: {
                    source: data.filter((d: string[]) => d[0] === startMonth),
                    dimensions: ["month", "name", "value", "color"],
                  },
                  series: barOption.series.map((s) => ({
                    ...s,
                  })),
                };
                chartInstance.setOption(barOptionWithTransition, {
                  notMerge: true,
                });
              }

              // Restart the bar race logic
              prepareGraph(true); // <-- Start race here
            },
          },
        ],
      },
    };

    // Bar race option
    const barOption: echarts.EChartsOption = {
      backgroundColor: "transparent",
      title: {
        text: "Bar race of scores per country",
        left: "center",
        textStyle: { color: "white", fontSize: fontSize },
      },
      grid: {
        left: 70,
        right: 40,
      },
      xAxis: {
        max: "dataMax",
        axisLabel: {
          formatter: (n: number) => Math.round(n).toString(),
        },
        splitLine: {
          show: false,
        },

        // z: 1,
        // zlevel: 1,
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
        z: 1,
        zlevel: 1,
        animationDuration: 300,
        animationDurationUpdate: 300,
      },
      dataset: {
        // Show only the first month's data initially (no race yet)
        source: data.filter((d: string[]) => d[0] === startMonth),
        dimensions: ["month", "name", "value", "color"],
      },
      series: [
        {
          realtimeSort: true,
          animation: true,
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
          animationDurationUpdate: updateFrequency,
          animationDuration: 300,
          animationEasingUpdate: "linear",
          animationEasing: "linear",
          universalTransition: true,
        },
      ],

      // Graphic elements
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
            type: "group",
            right: "10%",
            bottom: "30%",
            z: 110,
            zlevel: 10,
            children: [
              {
                type: "rect",
                shape: {
                  width: 140,
                  height: 40,
                },
                left: "center",
                top: "center",
                style: {
                  fill: "#007BFF",
                  stroke: "#0056b3",
                  lineWidth: 1,
                  shadowBlur: 2,
                  shadowColor: "rgba(0,0,0,0.3)",
                  shadowOffsetX: 1,
                  shadowOffsetY: 1,
                  cursor: "pointer",
                  z: 109,
                },
              },
              {
                type: "text",
                style: {
                  text: "Skip to Map",
                  fontSize: 14,
                  fontWeight: "bold",
                  fill: "#FFFFFF",
                  textAlign: "center",
                  textVerticalAlign: "middle",
                  cursor: "pointer",
                  z: 110,
                },
              },
            ],
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
              }, 0);
            },
          },
          {
            type: "group",
            right: "10%",
            bottom: "40%",
            z: 110,
            children: [
              {
                type: "rect",
                shape: {
                  width: 140,
                  height: 40,
                },
                left: "center",
                top: "center",
                style: {
                  fill: "#28a745",
                  stroke: "#19692c",
                  lineWidth: 1,
                  shadowBlur: 2,
                  shadowColor: "rgba(0,0,0,0.3)",
                  shadowOffsetX: 1,
                  shadowOffsetY: 1,
                  cursor: "pointer",
                  z: 109,
                },
              },
              {
                type: "text",
                style: {
                  text: "(Re-)start race",
                  fontSize: 14,
                  fontWeight: "bold",
                  fill: "#FFFFFF",
                  textAlign: "center",
                  textVerticalAlign: "middle",
                  cursor: "pointer",
                  z: 110,
                },
              },
            ],
            onclick: function () {
              // Clear all pending timeouts
              updateFunctionsRef.current.forEach((updateFn) => updateFn());

              // Restart the bar race from the beginning
              setOption((prevOption) => ({
                ...prevOption,
                dataset: {
                  source: data.filter((d: string[]) => d[0] === startMonth),
                },
                graphic: {
                  elements: [
                    {
                      ...prevOption?.graphic?.elements[0],
                      style: {
                        ...prevOption?.graphic?.elements[0]?.style,
                        text: startMonth,
                      },
                    },
                    prevOption?.graphic?.elements[1],
                    prevOption?.graphic?.elements[2],
                  ],
                },
              }));

              // Start the bar race updates again
              prepareGraph(true); // <-- Start race here
            },
          },
        ],
      },
    };

    // Initialize chart with bar option for the current "startMonth"
    const clone = Object.assign({}, barOption);
    setOption(clone);

    // Update function for each “frame” of the race
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

    // Only start the timeouts (i.e., the “race”) if startAnimation is true
    if (startAnimation) {
      const updates: Function[] = [];
      for (let i = startIndex; i < yearMonth.length - 1; ++i) {
        const timeoutId = setTimeout(
          () => updateYear(yearMonth[i + 1]),
          (i - startIndex) * updateFrequency
        );
        updates.push(() => clearTimeout(timeoutId));
      }
      updateFunctionsRef.current = updates;
    }
  };

  // On component mount, just display the initial bar chart at the first month (no race)
  useEffect(() => {
    prepareGraph(false); // Pass false to avoid auto-race
    return () => {
      // Cleanup timeouts when component unmounts
      updateFunctionsRef.current.forEach((updateFn) => updateFn());
    };
  }, []);

  return (
    <ReactECharts
      ref={chartRef}
      option={option || {}}
      style={{ height: isSmallScreen ? "800px" : "500px", width: "100%" }}
      opts={{ renderer: "canvas" }}
      theme="dark"
    />
  );
};

export default Page;
