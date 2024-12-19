"use client";
// Import necessary libraries
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
  if (!countryCode) {
    return "";
  }
  return (
    flagData.find(function (item) {
      return item.code === countryCode;
    }) || {}
  ).emoji;
}
const updateFrequency = 500;

const Page: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  const [option, setOption] = useState<echarts.EChartsOption | null>(null);
  const [isRaceFinished, setIsRaceFinished] = useState<boolean>(false);

  // Function to prepare scatter options
  const prepareGraph = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    let raceData: any[] = [];

    // Fetch and decompress scatter data
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

    const headerData = raceData.header;
    const data = raceData.data;

    const yearMonth: string[] = [];
    for (let i = 0; i < data.length; ++i) {
      if (
        yearMonth.length === 0 ||
        yearMonth[yearMonth.length - 1] !== data[i][0]
      ) {
        yearMonth.push(data[i][0]);
      }
    }

    const startIndex = yearMonth.length - 4; //1;
    const startMonth = yearMonth[startIndex];
    const endMonth = yearMonth[yearMonth.length - 1];

    // Create the map option
    const mapOption = {
      visualMap: {
        left: "right",
        min: 0,
        max: 60000,
        inRange: {
          // prettier-ignore
          color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
        },
        text: ["High", "Low"],
        calculable: false,
      },
      dataset: {
        source: data.filter(function (d: string[]) {
          return d[0] === endMonth;
        }),
      },
      series: [
        {
          id: "runscore",
          type: "map",
          roam: true,
          map: "WORLD",
          animationDurationUpdate: 1000,
          universalTransition: true,
          encode: {
            value: 2,
            name: 1,
          },
        },
      ],
    };

    // Create the bar race option
    const option: echarts.EChartsOption = {
      grid: {
        top: 10,
        bottom: 30,
        left: 150,
        right: 80,
      },
      xAxis: {
        max: "dataMax",
        axisLabel: {
          formatter: function (n: number) {
            return Math.round(n) + "";
          },
        },
      },
      dataset: {
        source: data.filter(function (d: string[]) {
          return d[0] === startMonth;
        }),
        // dimensions: raceData[0],
      },
      yAxis: {
        type: "category",
        inverse: true,
        max: 10,
        axisLabel: {
          show: true,
          fontSize: 14,
          formatter: function (value: any) {
            return value + "{flag|" + getFlag(value) + "}";
          },
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
      series: [
        {
          realtimeSort: true,
          seriesLayoutBy: "column",
          type: "bar",
          itemStyle: {
            color: function (params: any) {
              // Access the fourth column value from the dataset
              return params.data[3]; // Assuming the fourth column in your dataset is color
            },
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
      // Disable init animation.
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

    // Update the chart option state
    setOption(option);

    for (let i = startIndex; i < yearMonth.length - 1; ++i) {
      (function (i) {
        setTimeout(function () {
          updateYear(yearMonth[i + 1]);
        }, (i - startIndex) * updateFrequency);
      })(i);
    }

    function updateYear(year: string) {
      const source = data.filter(function (d: string[]) {
        return d[0] === year;
      });

      setOption((prevOption) => ({
        ...prevOption,
        series: [
          {
            ...prevOption.series[0],
            data: source,
          },
        ],
        graphic: {
          ...prevOption.graphic,
          elements: [
            {
              ...prevOption.graphic.elements[0],
              style: {
                ...prevOption.graphic.elements[0].style,
                text: year,
              },
            },
          ],
        },
      }));

      // If it's the last year in the data, transition to the map option
      if (year === endMonth) {
        setIsRaceFinished(true);
        setOption(mapOption, true); // Transition to map visualization
      }
    }
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
