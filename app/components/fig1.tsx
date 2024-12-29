"use client";

import React, { useRef, useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
// Example data
import game_counts from "../../public/data/game_counts.json";
// pako for Gzip
import pako from "pako";

type EChartsOption = echarts.EChartsOption;
type OptionsDictionary = Record<string, EChartsOption>;

// Helper to detect Safari
function isSafari() {
  if (typeof navigator === "undefined") return false; // SSR safety
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("safari") && !ua.includes("chrome");
}

const Page: React.FC = () => {
  // =============================================================================
  // REFS & STATE
  // =============================================================================
  const chartRef = useRef<ReactECharts | null>(null);
  const allOptions: OptionsDictionary = {};
  const optionStack: string[] = [];

  // Flicker code uses a setInterval
  const flickerIntervalRef = useRef<number | null>(null);

  // If we detect Safari, skip flicker
  const safari = true; //isSafari();

  // -----------------------------------------------------------------------------
  // Flicker Management
  // -----------------------------------------------------------------------------
  const startFlicker = () => {
    // If user is on Safari, skip flicker to avoid performance issues
    if (safari) {
      console.log("Safari detected, flicker skipped.");
      return;
    }
    // If we're already flickering, skip
    if (flickerIntervalRef.current !== null) return;

    const chartInstance = chartRef.current?.getEchartsInstance();
    if (!chartInstance) return;

    flickerIntervalRef.current = window.setInterval(() => {
      const currentOption = chartInstance.getOption();
      if (!currentOption?.series) return;

      // Recalculate symbolSize only on scatter series
      const newSeries = currentOption.series.map((s: any) => {
        if (s.type === "scatter") {
          return {
            ...s,
            symbolSize: (data: any, params: any) => {
              const baseSize = 8; // Base size
              const randomFactor = Math.random() * 4; // Randomize initial size
              const waveFrequency = 0.1; // Wave frequency
              const timeFactor = Date.now() / 1000; // Time-based oscillation

              return (
                baseSize +
                randomFactor +
                Math.sin(waveFrequency * (params.dataIndex + timeFactor)) * 4
              );
            },
          };
        }
        return s;
      });

      chartInstance.setOption({ series: newSeries }, false);
    }, 500);

    console.log("Flicker started (non-Safari).");
  };

  const stopFlicker = () => {
    if (flickerIntervalRef.current !== null) {
      clearInterval(flickerIntervalRef.current);
      flickerIntervalRef.current = null;
      console.log("Flicker stopped");
    }
  };

  // Helper to check if a chart ID should flicker
  const chartIdIsScatter = (chartId?: string) => {
    return chartId?.startsWith("scat_");
  };

  let isSmallScreen = false;
  if (typeof window !== "undefined") {
    isSmallScreen = window.innerWidth < 768;
  } else {
    console.error("Window object is not available.");
  }
  const fontSize = isSmallScreen ? 12 : 18;

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h}h ${m}m ${s}s ${ms}ms`;
  };

  const fetchAndDecompress = async (url: string): Promise<any[]> => {
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const decompressed = pako.inflate(new Uint8Array(buffer), {
        to: "string",
      });
      return JSON.parse(decompressed);
    } catch (error) {
      console.error(`Error fetching or decompressing data from ${url}:`, error);
      return [];
    }
  };

  // =============================================================================
  // NAVIGATION LOGIC
  // =============================================================================
  const goForward = (nextOptionId: string) => {
    if (!allOptions[nextOptionId]) {
      console.error(
        `Option with ID "${nextOptionId}" is missing in allOptions.`
      );
      return;
    }
    if (!chartRef.current) return;

    const instance = chartRef.current.getEchartsInstance();
    const currentOption = instance.getOption() as EChartsOption;
    const currentOptionId = currentOption.id as string;

    // Push current chart ID so we can goBack() later
    optionStack.push(currentOptionId);
    console.log(
      `Navigating from ${currentOptionId} forward to: ${nextOptionId}`
    );

    const isDistributionOrScatter = nextOptionId.startsWith("scat_");
    if (isDistributionOrScatter) {
      const copyKey = currentOptionId + "_copy";
      if (!allOptions[copyKey]) {
        const safeCopy = JSON.parse(JSON.stringify(currentOption));
        safeCopy.id = copyKey;
        safeCopy.graphic = [
          {
            type: "text",
            left: 50,
            top: 20,
            style: {
              text: "Back",
              fontSize: 18,
              fill: "grey",
            },
            onclick: () => goBack(),
          },
        ];
        allOptions[copyKey] = safeCopy;
      }

      try {
        const datasetObj = currentOption?.dataset?.[0];
        if (datasetObj?.source) {
          const l_child_identifiers = datasetObj.source.map(
            (item: any) => item.child_identifier_per_bin
          );
          const seriesArr = Array.isArray(currentOption.series)
            ? currentOption.series
            : [currentOption.series];

          seriesArr.forEach((s: any) => {
            s.universalTransition = s.universalTransition || {};
            s.universalTransition.seriesKey = l_child_identifiers;
          });

          instance.setOption(currentOption, { notMerge: false, silent: true });
          allOptions[currentOptionId] = instance.getOption() as EChartsOption;
        }
      } catch (error) {
        console.log("Error injecting universalTransition:", error);
      }
    }

    // Show the new chart
    try {
      instance.setOption(allOptions[nextOptionId], true);
    } catch (error) {
      console.error(
        "Error setting the new chart option. Trying fallback copy."
      );
      const fallbackId = nextOptionId + "_copy";
      if (allOptions[fallbackId]) {
        instance.setOption(allOptions[fallbackId], true);
      } else {
        console.error("No fallback copy found for:", fallbackId);
      }
    }

    // Decide if we should flicker based on the new chart's ID
    if (chartIdIsScatter(nextOptionId)) {
      startFlicker();
    } else {
      stopFlicker();
    }
  };

  const goBack = () => {
    if (!chartRef.current) {
      console.log("No chart reference available.");
      return;
    }
    if (optionStack.length === 0) {
      console.log("Already at the root chart. No previous chart in the stack.");
      return;
    }

    const instance = chartRef.current.getEchartsInstance();
    const currentOption = instance.getOption() as EChartsOption;
    const prevOptionId = optionStack.pop()!;
    const prevOption = allOptions[prevOptionId];

    console.log("Going back from", currentOption.id, "to", prevOptionId);

    if (!prevOption) {
      console.log("No stored option for", prevOptionId);
      return;
    }

    if (
      prevOptionId.endsWith("_submission") ||
      prevOptionId.startsWith("dist_")
    ) {
      const seriesArr = Array.isArray(currentOption.series)
        ? currentOption.series
        : [currentOption.series];
      seriesArr.forEach((s: any) => {
        if (s.universalTransition) {
          delete s.universalTransition.seriesKey;
        }
      });
      currentOption.series = seriesArr;
      allOptions[currentOption.id as string] = currentOption;
    }

    instance.setOption(prevOption, true);

    // Now that we've gone back, check the ID of the displayed chart
    const newId = prevOption.id as string;
    if (chartIdIsScatter(newId)) {
      startFlicker();
    } else {
      stopFlicker();
    }
  };

  const onChartClick = (params: any) => {
    const nextId = params.data?.child_identifier;
    if (!nextId) return;

    if (allOptions[nextId]) {
      goForward(nextId);
    } else {
      console.warn(`No data available for child_identifier: "${nextId}"`);
    }
  };

  // =============================================================================
  // FACTORY FUNCTIONS
  // =============================================================================
  const createOptionForGameCounts = (): EChartsOption => {
    const richStyles: Record<string, any> = {};
    game_counts.forEach((game) => {
      const styleName = "img_" + game.ID;
      richStyles[styleName] = {
        backgroundColor: {
          image: `images/${game.ID}_icon.webp`,
        },
        width: 18,
        height: 18,
        align: "left",
      };
    });

    return {
      id: game_counts[0].identifier,
      title: {
        text: "Top 50 most speedrunned games",
        left: "center",
        textStyle: { color: "white", fontSize: fontSize },
      },
      animation: true,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const item = params[0]?.data || {};
          return [
            "Game: " + item["name"],
            "Total Submissions: " + item["count"],
            "% of all submissions in 2023: " +
              parseFloat(item["percent_2023"]).toFixed(1) +
              "%",
          ].join("<br/>");
        },
      },
      grid: { left: 10 },
      xAxis: {
        type: "value",
        name: "Submission count",
        axisLabel: { formatter: "{value}" },
      },
      yAxis: {
        type: "category",
        inverse: true,
        show: false,
      },
      animationDurationUpdate: 500,
      dataset: {
        dimensions: [
          "name",
          "count",
          "ID",
          "identifier",
          "child_identifier",
          "percent_2023",
        ],
        source: game_counts,
      },
      dataZoom: [
        {
          type: "slider",
          show: true,
          yAxisIndex: [0],
          start: 0,
          end: 30,
          filterMode: "filter",
          brushSelect: false,
        },
        {
          type: "inside",
          start: 0,
          end: 30,
          yAxisIndex: [0],
          filterMode: "empty",
          zoomLock: true,
          moveOnMouseWheel: true,
          zoomOnMouseWheel: false,
        },
      ],
      series: [
        {
          type: "bar",
          encode: {
            x: "count",
            y: "name",
            itemGroupId: "identifier",
            itemChildGroupId: "child_identifier",
          },
          universalTransition: { enabled: true },
          label: {
            show: true,
            position: "inside",
            formatter: (params) => {
              const { name, ID } = params.data;
              return `{img_${ID}|} ${name} {img_${ID}|}`;
            },
            color: "#fff",
            textShadowBlur: 3,
            textShadowColor: "#000",
            rich: richStyles,
          },
          itemStyle: {
            borderRadius: [0, 20, 20, 0],
            borderWidth: 2,
            borderColor: "#333",
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: "#ff5733" },
                { offset: 0.5, color: "#33c5ff" },
                { offset: 1, color: "#ff33d4" },
              ],
            },
            shadowBlur: 10,
            shadowColor: "rgba(0,0,0,0.5)",
          },
          emphasis: {
            focus: "self",
            itemStyle: {
              shadowBlur: 20,
              shadowColor: "#fff",
              color: {
                type: "radial",
                x: 0.5,
                y: 0.5,
                r: 1,
                colorStops: [
                  { offset: 0, color: "#ffcc33" },
                  { offset: 1, color: "#ff5733" },
                ],
              },
            },
          },
        },
      ],
    };
  };

  // =============================================================================
  // PREPARE ALL OPTIONS (LOCAL + FETCHED)
  // =============================================================================
  const option_counts = createOptionForGameCounts();
  allOptions[option_counts.id!] = option_counts;
  optionStack.push(option_counts.id as string);

  const prepareOptions = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const scatterData = await fetchAndDecompress(
      `${baseUrl}/data/scatter_data.json.gz`
    );
    const submissionTypes = await fetchAndDecompress(
      `${baseUrl}/data/submission_types.json.gz`
    );
    const distributionTypes = await fetchAndDecompress(
      `${baseUrl}/data/distribution_types.json.gz`
    );
    // Build options for submission types
    submissionTypes.forEach((dataSet: any[]) => {
      const optionId = dataSet[0]["identifier"];
      allOptions[optionId] = {
        id: optionId,
        title: {
          text: "Categories for " + dataSet[0]["name"],
          left: "center",
          textStyle: { color: "white", fontSize: fontSize },
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: (params: any) => {
            const item = params[0]?.data || {};
            return [
              "Category: " + item["name_category"],
              "Submissions: " + item["count"],
              "% of submissions in 2023: " +
                parseFloat(item["percent_2023"]).toFixed(1) +
                "%",
            ].join("<br/>");
          },
        },
        grid: { left: 100 },
        xAxis: {
          type: "value",
          name: "Submission count per category",
          axisLabel: { formatter: "{value}" },
        },
        yAxis: {
          type: "category",
          inverse: true,
        },
        visualMap: {
          orient: "horizontal",
          left: "center",
          text: ["% of all submissions in 2023"],
          dimension: "percent_2023",
          inRange: {
            color: ["#65B581", "#FFCE34", "#FD665F"],
          },
          min: 0,
          max: 100,
        },
        animationDurationUpdate: 500,
        dataset: {
          dimensions: [
            "name_category",
            "count",
            "identifier",
            "child_identifier",
            "percent_2023",
          ],
          source: dataSet,
        },
        series: {
          type: "bar",
          encode: {
            x: "count",
            y: "name_category",
            itemGroupId: "identifier",
            itemChildGroupId: "child_identifier",
          },
          universalTransition: { enabled: true },
        },
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
            onclick: () => goBack(),
          },
        ],
      };
    });

    // Build options for distribution types
    distributionTypes.forEach((dataSet: any[]) => {
      const optionId = dataSet[0]["identifier"];
      allOptions[optionId] = {
        id: optionId,
        title: {
          text:
            "Distribution of speedrun times for category " +
            dataSet[0]["name_category"] +
            " of game " +
            dataSet[0]["game"],
          left: "center",
          textStyle: { color: "white", fontSize: fontSize },
        },

        tooltip: {
          trigger: "item",
          axisPointer: { type: "shadow" },
          formatter: (params: any) => {
            const item = params.data || {};
            return [
              "Bin: " + item["bin_label"],
              "Submissions: " + item["count_all"],
              "% of submissions in 2023: " +
                parseFloat(item["percent_2023"]).toFixed(1) +
                "%",
            ].join("<br/>");
          },
        },
        grid: { left: 100 },
        xAxis: {
          type: "value",
          name: "Submission count per category",
          axisLabel: { formatter: "{value}" },
        },
        yAxis: {
          type: "category",
        },
        animationDurationUpdate: 500,
        dataset: {
          dimensions: [
            "bin",
            "bin_label",
            "count_all",
            "identifier",
            "child_identifier",
            "child_identifier_per_bin",
            "percent_2023",
          ],
          source: dataSet,
        },
        series: [
          {
            type: "bar",
            encode: {
              x: "count_all",
              y: "bin_label",
              itemGroupId: "identifier",
              itemChildGroupId: "child_identifier_per_bin",
            },
            universalTransition: { enabled: true },
            barGap: "0%",
            barCategoryGap: "0%",
            itemStyle: {
              borderWidth: 0,
              borderColor: "#000",
              color: "#3498db",
            },
            emphasis: {
              focus: "series",
              itemStyle: {
                borderColor: "#ff5733",
                borderWidth: 3,
              },
            },
          },
        ],
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
            onclick: () => goBack(),
          },
        ],
      };
    });

    // Build scatter charts with flickering "stars" + a background logo
    Object.entries(scatterData).forEach(
      ([optionId, [dic_per_bin, best_line, true_ID, game, category]]) => {
        // Create multiple scatter series
        const l_series = Object.entries(dic_per_bin).map(
          ([bin_id, l_runs]: any) => ({
            type: "scatter",
            // 1) Diamond shape
            symbol: "diamond",
            // 2) Pulsating size (mild wave + random factor)
            symbolSize: (data: any, params: any) => {
              const baseSize = 8; // Base size
              const randomFactor = Math.random() * 4; // Slight random flicker
              const waveFrequency = 0.1; // Very gentle wave
              const timeFactor = Date.now() / 1000; // Continually changes over time

              return (
                baseSize +
                randomFactor +
                Math.sin(waveFrequency * (params.dataIndex + timeFactor)) * 4
              );
            },
            // 3) Radial glow itemStyle
            itemStyle: {
              color: {
                type: "radial",
                x: 0.5,
                y: 0.5,
                r: 0.8,
                colorStops: [
                  { offset: 0, color: "rgba(255, 255, 255, 1)" }, // bright center
                  { offset: 0.5, color: "rgba(216, 206, 146, 0.8)" }, // golden glow
                  { offset: 1, color: "rgba(255, 215, 0, 0)" }, // fade to transparent
                ],
              },
            },
            // 4) Strong white shadow on hover
            emphasis: {
              itemStyle: {
                shadowBlur: 30,
                shadowColor: "rgba(255, 255, 255, 1)",
              },
            },
            // 5) Some animation & z-index
            animationDuration: 2000,
            z: 2,

            // The usual scatter data fields
            dimensions: ["date", "time", "player", "location"],
            data: l_runs,
            dataGroupId: bin_id,
            id: bin_id,
            encode: { x: "date", y: "time" },
            universalTransition: { enabled: true },
          })
        );

        // Add the line
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

        // Calculate the best time (minimum time)
        const bestTime = Math.min(...yValues);
        const formattedBestTime = formatTime(bestTime);

        allOptions[optionId] = {
          id: optionId,
          backgroundColor: "transparent", // For better integration
          title: {
            text:
              "Speedrun times for category " + category + " of game " + game,
            textStyle: { color: "white", fontSize: fontSize },
            left: "center",
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
          grid: { left: 100 },
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
          animationDurationUpdate: 500,
          animationThreshold: 20000,
          progressive: 20000,
          progressiveThreshold: 20000,
          // Add a subtle background logo
          graphic: [
            {
              type: "image",
              id: "background",
              left: "center",
              top: "middle",
              z: 0,
              style: {
                // e.g. "images/scat_mario_icon_rescaled.webp"
                // or you can define your own naming scheme
                image: `images/${true_ID}_icon_rescaled.webp`,
                width: 200,
                height: 200,
                opacity: 0.2,
              },
            },
            {
              type: "text",
              left: 50,
              top: 20,
              style: {
                text: "Back",
                fontSize: 18,
                fill: "grey",
              },
              onclick: () => goBack(),
            },
            {
              type: "group",
              left: isSmallScreen ? "40%" : "20%", // Position at the right 20% if small screen
              top: isSmallScreen ? "15%" : "auto", // Position at the top 15% if small screen
              bottom: isSmallScreen ? "auto" : "15%", // Adjust as needed
              z: 100000, // Ensure it's above scatter points
              silent: true, // Make the graphic non-clickable
              children: [
                {
                  type: "rect",
                  shape: {
                    width: isSmallScreen ? 150 : 200,
                    height: isSmallScreen ? 30 : 50,
                  },
                  style: {
                    fill: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
                    stroke: "#00FF00", // Green border for video game feel
                    lineWidth: 2,
                    shadowBlur: 10,
                    shadowColor: "#00FF00",
                    // Optional: Add rounded corners
                    // Define borderRadius if desired
                    // borderRadius: [10, 10, 10, 10],
                  },
                  z: 1000001,
                },
                {
                  type: "text",
                  style: {
                    text: `Best Time: ${formattedBestTime}`,
                    x: isSmallScreen ? 75 : 100, // Center the text
                    y: isSmallScreen ? 15 : 25, // Center the text
                    textAlign: "center",
                    textVerticalAlign: "middle",
                    fill: "#00FF00", // Green text color
                    font: 'bold 0.5em "Press Start 2P", cursive', // Pixel-style font
                    // If "Press Start 2P" is not available, use a default monospace font
                    // font: 'bold 16px monospace',
                    // Add a glow effect using shadow
                    textShadowColor: "#00FF00",
                    textShadowBlur: 4,
                  },
                  z: 1000002,
                },
              ],
            },
          ],
          series: l_series,
        };
      }
    );
  };

  // =============================================================================
  // LIFECYCLE
  // =============================================================================
  useEffect(() => {
    (async () => {
      try {
        await prepareOptions();
      } catch (error) {
        console.error("Error preparing options:", error);
      }
    })();
  }, []);

  // =============================================================================
  // RENDER
  // =============================================================================
  const onEvents = { click: onChartClick };
  const heightGraph = isSmallScreen ? "600px" : "800px";
  return (
    <ReactECharts
      ref={chartRef}
      option={option_counts}
      style={{ height: heightGraph, width: "100%" }}
      opts={{ renderer: "canvas" }}
      theme="light"
      onEvents={onEvents}
    />
  );
};

export default Page;
