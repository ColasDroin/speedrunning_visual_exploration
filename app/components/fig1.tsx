"use client";

import React, { useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
// Example data
import game_counts from "../../public/data/game_counts.json";
// pako for Gzip
import pako from "pako";

type EChartsOption = echarts.EChartsOption;
type OptionsDictionary = Record<string, EChartsOption>;

const Page: React.FC = () => {
  // =============================================================================
  // REFS & STATE
  // =============================================================================
  const chartRef = useRef<ReactECharts | null>(null);
  // Holds all prebuilt chart options keyed by an ID
  const allOptions: OptionsDictionary = {};
  // Keeps track of navigation history for going back/forward
  const optionStack: string[] = [];

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

  /**
   * Helper to fetch and decompress gzip JSON.
   */
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
  // NAVIGATION LOGIC (ORIGINAL STYLE) + isSpecial CHECK
  // =============================================================================

  /**
   * Go forward to a new chart (push the current one onto the stack).
   * Restores original logic from your first code version, with universal transitions.
   */
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
    console.log("Pushing current option onto stack:", currentOptionId);
    console.log(`Navigating forward to: ${nextOptionId}`);

    // If transitioning to scatter or distribution, we inject seriesKey
    const isDistributionOrScatter = nextOptionId.startsWith("scat_");

    if (isDistributionOrScatter) {
      // Create a safe copy if not already stored
      const copyKey = currentOptionId + "_copy";
      if (!allOptions[copyKey]) {
        const safeCopy = JSON.parse(JSON.stringify(currentOption));
        safeCopy.id = copyKey;
        // Ensure the "Back" graphic is preserved
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

      // Attempt to set or update the `seriesKey`
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
          // Update the instance with the modified current option
          instance.setOption(currentOption, { notMerge: false, silent: true });
          // Store a fresh copy of currentOption
          allOptions[currentOptionId] = instance.getOption() as EChartsOption;
        }
      } catch (error) {
        console.log("Error injecting universalTransition:", error);
      }
    }

    // Finally, navigate forward to the next chart
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
  };

  /**
   * Go back (pop from the stack). This is the original logic, but we keep the `isSpecial` check.
   * We also remove or re-inject seriesKey as in your older code.
   */
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

    // Pop from the stack => the previous chart we want to revert to
    const prevOptionId = optionStack.pop()!;
    const prevOption = allOptions[prevOptionId];

    console.log("Going back from", currentOption.id, "to", prevOptionId);

    if (!prevOption) {
      console.log("No stored option for", prevOptionId);
      return;
    }

    // The original code also removed the `seriesKey` if we return to certain charts
    // Example: if (previousOptionId.endsWith("_submission") || previousOptionId.startsWith("dist_")) { ... }
    // Or you can adapt it exactly as in your original code:
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
      // Overwrite local copy
      allOptions[currentOption.id as string] = currentOption;
    }

    // Finally, set the previous chart
    instance.setOption(prevOption, true);
  };

  /**
   * If user clicks on a bar that has `child_identifier`, we goForward().
   */
  const onChartClick = (params: any) => {
    if (params.data?.child_identifier) {
      goForward(params.data.child_identifier);
    }
  };

  // =============================================================================
  // FACTORY FUNCTIONS (Same as your code)
  // =============================================================================
  const createOptionForGameCounts = (): EChartsOption => {
    // ... identical to your code ...
    return {
      id: game_counts[0].identifier,
      title: { text: "Most speedrunned games" },
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
      grid: { left: 0 },
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
          end: 40,
          filterMode: "filter",
          brushSelect: false,
        },
        {
          type: "inside",
          start: 0,
          end: 40,
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
            formatter: "{b}",
            color: "#fff",
            textShadowBlur: 3,
            textShadowColor: "#000",
          },
          itemStyle: {
            borderRadius: [5, 5, 5, 5],
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

  // Put them into the dictionary
  allOptions[option_counts.id!] = option_counts;

  // Initialize stack with the "Most speedrunned games" ID, etc.
  optionStack.push(option_counts.id as string);

  // Fetch and prepare the rest of the options
  const prepareOptions = async () => {
    // Load data from your server
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
        title: { text: "Most speedrunned category of game X" },
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
        grid: { left: 200 },
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
          text: "Distribution of speedrun times for category X of game X",
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
        grid: { left: 200 },
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

    // Build scatter charts (like zelda, but loaded dynamically)
    Object.entries(scatterData).forEach(
      ([optionId, [dic_per_bin, best_line]]) => {
        // Create multiple scatter series
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

        allOptions[optionId] = {
          id: optionId,
          title: { text: "Speedrun times for category X of game X" },
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
            type: "value", // Corrected type
            name: "Speedrun time",
            axisLabel: {
              formatter: (value: number) => formatTime(value), // Directly formatting the seconds
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =============================================================================
  // RENDER
  // =============================================================================
  const onEvents = { click: onChartClick };

  return (
    <ReactECharts
      ref={chartRef}
      option={option_counts}
      style={{ height: "800px", width: "100%" }}
      opts={{ renderer: "canvas" }}
      theme="light"
      onEvents={onEvents}
    />
  );
};

export default Page;
