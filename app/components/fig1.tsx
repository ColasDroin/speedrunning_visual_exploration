"use client";

import React, { useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import game_counts from "../../public/data/game_counts.json";
import scatterZelda from "../../public/data/scatter_zelda.json";
import pako from "pako";

type EChartsOption = echarts.EChartsOption;
type ChartInstance = echarts.ECharts;
type OptionsDictionary = Record<string, EChartsOption>;

const Page: React.FC = () => {
  // =============================================================================
  // REFS & DATA STRUCTURES
  // =============================================================================
  const chartRef = useRef<ReactECharts | null>(null);
  // Stores all possible chart options keyed by ID
  const allOptions: OptionsDictionary = {};
  // A stack to keep track of navigation history
  const optionStack: string[] = [];

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================
  /**
   * Convert a number of seconds to an `h m s ms` string.
   */
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h}h ${m}m ${s}s ${ms}ms`;
  };

  /**
   * Fetch and decompress GZipped JSON data from a URL.
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
  // CHART NAVIGATION
  // =============================================================================

  /**
   * Move forward to a new chart option (push the current one onto the stack).
   * This is where we preserve universal transitions by injecting seriesKey.
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

    // Push the current chart ID onto the stack so we can return via goBack()
    optionStack.push(currentOptionId);
    console.log("Pushing current option onto stack:", currentOptionId);
    console.log(`Navigating forward to: ${nextOptionId}`);

    // -------------------------------------------------------------------------
    // 1) If we are transitioning between distribution <-> scatter,
    //    we can add the seriesKey for universal transitions.
    //    Adjust condition as needed (e.g. checking for "dist_", "scat_", etc.).
    // -------------------------------------------------------------------------
    const isDistributionOrScatter =
      nextOptionId.startsWith("scat_") || nextOptionId.startsWith("dist_");

    if (isDistributionOrScatter) {
      // Create a safe copy of the current option if not already present
      const copyKey = currentOptionId + "_copy";
      if (!allOptions[copyKey]) {
        const safeCopy = JSON.parse(JSON.stringify(currentOption));
        safeCopy.id = copyKey;
        // Ensure the "Back" graphic is preserved in the copy
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
        // Store the safe copy
        allOptions[copyKey] = safeCopy;
      }

      // Attempt to set or update the `seriesKey` for the current chart to ensure
      // universal transitions.
      try {
        // For example, if your dataset items have "child_identifier_per_bin"
        // or something similar that you want to match from bar -> scatter
        const datasetObj = currentOption?.dataset?.[0];
        if (datasetObj?.source) {
          const l_child_identifiers = datasetObj.source.map(
            (item: any) => item.child_identifier_per_bin
          );
          // For each series in the current chart, set the universalTransition key
          if (currentOption.series) {
            const seriesArr = Array.isArray(currentOption.series)
              ? currentOption.series
              : [currentOption.series];

            seriesArr.forEach((s: any) => {
              s.universalTransition = s.universalTransition || {};
              s.universalTransition.seriesKey = l_child_identifiers;
            });
          }
          // Update the instance with the modified current option
          instance.setOption(currentOption, { notMerge: false, silent: true });
          // Store a “fresh” version of currentOption in allOptions
          allOptions[currentOptionId] = instance.getOption() as EChartsOption;
        }
      } catch (error) {
        console.error("Error injecting universalTransition:", error);
      }
    }

    // -------------------------------------------------------------------------
    // 2) Finally, set the new chart option
    // -------------------------------------------------------------------------
    try {
      instance.setOption(allOptions[nextOptionId], true);
    } catch (error) {
      console.error(
        "Error setting the new chart option. Trying fallback copy."
      );
      // If something fails, we can try the copy
      const fallbackId = nextOptionId + "_copy";
      if (allOptions[fallbackId]) {
        instance.setOption(allOptions[fallbackId], true);
      } else {
        console.error("No fallback copy found for:", fallbackId);
      }
    }
  };

  /**
   * Go back to the previous chart (pop from the stack).
   * If needed, remove the `seriesKey` property to reset transitions.
   */
  const goBack = () => {
    if (!chartRef.current) return;
    if (optionStack.length === 0) return;

    const instance = chartRef.current.getEchartsInstance();
    const currentOption = instance.getOption() as EChartsOption;

    // The ID we're going to revert to:
    const prevOptionId = optionStack.pop()!;
    const optionToGoBackTo = allOptions[prevOptionId];

    if (!optionToGoBackTo) {
      console.log("No stored option for", prevOptionId);
      return;
    }

    // ----------------------------------------------------------
    // 1) If this is a "scatter <-> distribution" transition,
    //    inject seriesKey on the chart we’re going BACK to,
    //    so ECharts can see matching keys for morphing.
    // ----------------------------------------------------------
    const isSpecial = currentOption.id?.startsWith("scatspecial_");

    if (isSpecial) {
      try {
        // For instance, if the distribution chart uses
        // `child_identifier_per_bin` as the key. Adjust to match your data.
        const datasetObj = optionToGoBackTo?.dataset;
        if (datasetObj?.source) {
          const l_child_identifiers = datasetObj.source.map(
            (item: any) => item.child_identifier_per_bin
          );

          const seriesArr = Array.isArray(optionToGoBackTo.series)
            ? optionToGoBackTo.series
            : [optionToGoBackTo.series];

          seriesArr.forEach((s: any) => {
            s.universalTransition = s.universalTransition || {};
            s.universalTransition.seriesKey = l_child_identifiers;
          });
        }
      } catch (error) {
        console.log("Error injecting seriesKey on goBack:", error);
      }
    }

    // ----------------------------------------------------------
    // 2) Now finally set the “previous” option
    // ----------------------------------------------------------
    instance.setOption(optionToGoBackTo, true);
  };

  /**
   * Handle chart click events to move forward if a child ID is available.
   */
  const onChartClick = (params: any) => {
    if (params.data?.child_identifier) {
      goForward(params.data.child_identifier);
    }
  };

  // =============================================================================
  // EXAMPLE: FACTORY FUNCTIONS FOR CHART OPTIONS
  // =============================================================================

  /**
   * Returns a bar chart option for the "Most speedrunned games" data (game_counts).
   */
  const createOptionForGameCounts = (): EChartsOption => ({
    id: game_counts[0]["identifier"],
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
  });

  /**
   * Returns a scatter chart option for the Zelda data (scatterZelda).
   */
  const createZeldaScatterOption = (): EChartsOption => {
    const optionId = Object.keys(scatterZelda)[0];
    const [dic_per_bin, best_line] = scatterZelda[optionId];

    // Build scatter series
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

    // Add the "best_line" series
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
          onclick: () => goBack(),
        },
      ],
    };
  };

  // =============================================================================
  // PREPARE ALL CHART OPTIONS (LOCAL + FETCHED)
  // =============================================================================
  const prepareOptions = async () => {
    const option_counts = createOptionForGameCounts();
    const option_zelda = createZeldaScatterOption();

    // Put them into the dictionary
    allOptions[option_counts.id!] = option_counts;
    allOptions[option_zelda.id!] = option_zelda;

    // Option stack initially starts with one chart if you like, or empty if you prefer
    optionStack.push(option_counts.id as string);
    const title_zelda = option_zelda.id.split("_")[1];
    const type_zelda = option_zelda.id.split("_")[2];
    optionStack.push(title_zelda + "_type_submission");
    optionStack.push("dist_" + title_zelda + "_" + type_zelda);

    // Function to prepare all others options

    // Fetch additional data (compressed) if needed
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

    // Build and add more charts from submission_types
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
        yAxis: { type: "category", inverse: true },
        visualMap: {
          orient: "horizontal",
          left: "center",
          text: ["% of all submissions in 2023"],
          dimension: "percent_2023",
          inRange: { color: ["#65B581", "#FFCE34", "#FD665F"] },
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

    // Build and add more charts from distribution_types
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
        yAxis: { type: "category" },
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

    // Build scatter charts from the *fetched* scatterData (like the Zelda example)
    Object.entries(scatterData).forEach(
      ([optionId, [dic_per_bin, best_line]]: any) => {
        // Build scatter series
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
              onclick: () => goBack(),
            },
          ],
        };
      }
    );
  };

  // =============================================================================
  // REACT HOOKS
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

  // By default, show the Zelda scatter or the "Most speedrunned games" bar chart
  const defaultZeldaOption = createZeldaScatterOption();

  return (
    <ReactECharts
      ref={chartRef}
      option={defaultZeldaOption}
      style={{ height: "800px", width: "100%" }}
      opts={{ renderer: "canvas" }}
      theme="light"
      onEvents={onEvents}
    />
  );
};

export default Page;
