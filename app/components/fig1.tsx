"use client";
// Import necessary libraries
import React, { useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import game_counts from "../../public/data/game_counts.json";
import submission_types from "../../public/data/submission_types.json";
import distribution_types from "../../public/data/distribution_types.json";
import pako from "pako";

const Page: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  type EChartsOption = echarts.EChartsOption;
  const allOptions: { [key: string]: any } = {};
  const optionStack: string[] = [];
  let option_1: EChartsOption;

  // Initialize the first option
  option_1 = {
    id: game_counts[0]["identifier"],
    title: {
      text: "Most speedrunned games",
    },
    animation: true,
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params: unknown) {
        return [
          "Game: " + params[0].data["name"],
          "Total Submissions: " + params[0].data["count"],
          "% of all submissions in 2023: " +
            parseFloat(params[0].data["percent_2023"]).toFixed(1) +
            "%",
        ].join("<br/>");
      },
    },
    grid: {
      left: 250,
    },
    xAxis: {
      type: "value",
      name: "Submission count",
      axisLabel: {
        formatter: "{value}",
      },
    },
    yAxis: {
      type: "category",
      inverse: true,
    },
    visualMap: {
      orient: "horizontal",
      left: "center",
      text: ["submissions (%) in 2023"],
      textStyle: {
        //fontSize: 50,
        color: "#fff",
        //align: "center",
        //verticalAlign: "middle",
        //overflow: "break",
      },

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
        end: 20,
        filterMode: "filter",
        brushSelect: false,
      },
      {
        type: "inside",
        start: 0,
        end: 10,
        yAxisIndex: [0],
        filterMode: "empty",
        zoomLock: false,
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
        universalTransition: {
          enabled: true,
        },
        label: {
          show: true,
          position: "inside",
          formatter: "{b}",
        },
        emphasis: {
          disabled: false,
          focus: "self",
        },
      },
    ],
  };
  allOptions[game_counts[0]["identifier"]] = option_1;

  // Add options for submission types
  submission_types.forEach((data, index) => {
    const optionId = data[0]["identifier"];
    const option = {
      id: optionId,
      title: {
        text: "Most speedrunned category of game X",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: function (params: unknown) {
          return [
            "Category: " + params[0].data["name_category"],
            "Submissions: " + params[0].data["count"],
            "% of submissions in 2023: " +
              parseFloat(params[0].data["percent_2023"]).toFixed(1) +
              "%",
          ].join("<br/>");
        },
      },
      grid: {
        left: 250,
      },
      xAxis: {
        type: "value",
        name: "Submission count per category",
        axisLabel: {
          formatter: "{value}",
        },
      },
      yAxis: {
        type: "category",
        inverse: true,
      },
      visualMap: {
        orient: "horizontal",
        left: "center",
        text: ["% of all submissions in 2023"],
        // Map the score column to color
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
        source: data,
      },
      series: {
        type: "bar",
        encode: {
          x: "count",
          y: "name_category",
          itemGroupId: "identifier",
          itemChildGroupId: "child_identifier",
        },
        universalTransition: {
          enabled: true,
          // divideShape: "clone",
        },
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
          onclick: function () {
            goBack();
          },
        },
      ],
    };
    allOptions[optionId] = option;
  });

  distribution_types.forEach((data, index) => {
    const optionId = data[0]["identifier"];
    const option = {
      id: optionId,
      title: {
        text: "Distribution of speedrun times for category X of game X",
      },
      tooltip: {
        trigger: "item",
        axisPointer: {
          type: "shadow",
        },
        formatter: function (params: unknown) {
          return [
            "Bin: " + params.data["bin_label"],
            "Submissions: " + params.data["count_all"],
            "% of submissions in 2023: " +
              parseFloat(params.data["percent_2023"]).toFixed(1) +
              "%",
          ].join("<br/>");
        },
      },
      grid: {
        left: 250,
      },
      xAxis: {
        type: "value",
        name: "Submission count per category",
        axisLabel: {
          formatter: "{value}",
        },
      },
      yAxis: {
        type: "category",
        // inverse: true,
      },
      visualMap: {
        orient: "horizontal",
        left: "center",
        text: ["% of all submissions in 2023"],
        // Map the score column to color
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
          "bin",
          "bin_label",
          "count_all",
          "identifier",
          "child_identifier",
          "child_identifier_per_bin",
          "percent_2023",
        ],
        source: data,
      },
      series: {
        type: "bar",
        // id: "test",
        encode: {
          x: "count_all",
          y: "bin_label",
          itemGroupId: "identifier",
          itemChildGroupId: "child_identifier_per_bin",
        },
        universalTransition: {
          enabled: true,
        },
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
          onclick: () => {
            goBack();
          },
        },
      ],
    };
    allOptions[optionId] = option;
  });

  // Function to prepare scatter options
  const prepareOptions = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    let scatterData: any[] = [];

    // Fetch and decompress scatter data
    try {
      const response = await fetch(`${baseUrl}/data/scatter_data.json.gz`);
      const buffer = await response.arrayBuffer();
      const decompressed = pako.inflate(new Uint8Array(buffer), {
        to: "string",
      });
      scatterData = JSON.parse(decompressed);
    } catch (error) {
      console.error("Error fetching scatter data:", error);
    }

    // Add scatter plot options
    for (const data of Object.entries(scatterData)) {
      const dic_per_bin = data[1];
      const optionId = data[0];
      const l_series = [];
      for (const [bin_id, l_runs] of Object.entries(dic_per_bin)) {
        l_series.push({
          type: "scatter",
          dimensions: ["date", "time", "player", "location"],
          data: l_runs,
          dataGroupId: bin_id,
          id: bin_id,
          encode: { x: "date", y: "time" },
          universalTransition: { enabled: true },
        });
      }

      allOptions[optionId] = {
        id: optionId,
        title: {
          text: "Speedrun times for category X of game X",
        },
        tooltip: {
          trigger: "item",
          axisPointer: {
            type: "shadow",
          },
          formatter: function (params: unknown) {
            const formatTime = (seconds: number) => {
              const h = Math.floor(seconds / 3600);
              const m = Math.floor((seconds % 3600) / 60);
              const s = Math.floor(seconds % 60);
              const ms = Math.floor((seconds % 1) * 1000);
              return `${h}h ${m}m ${s}s ${ms}ms`;
            };
            return [
              "Date: " + params.data[0],
              "Run time: " + formatTime(params.data[1]),
              "Player: " + params.data[2],
              "Location: " + params.data[3],
            ].join("<br/>");
          },
        },
        grid: {
          left: 250,
        },
        yAxis: {
          type: "time",
          name: "Speedrun time",
        },
        xAxis: {
          type: "time",
          name: "Date",
        },
        // visualMap: {
        //   orient: "horizontal",
        //   left: "center",
        //   text: ["Test"],
        //   // Map the score column to color
        //   dimension: "time",
        //   inRange: {
        //     color: ["#65B581", "#FFCE34", "#FD665F"],
        //   },
        //   min: 0,
        //   max: 1000,
        // },
        animationDurationUpdate: 500,
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
            onclick: function () {
              goBack();
            },
          },
        ],
      };
    }
  };

  // Use effect to prepare options and initialize the chart
  useEffect(() => {
    (async () => {
      try {
        await prepareOptions();
      } catch (error) {
        console.error("Error preparing options:", error);
      }
    })();
  });

  const goForward = (optionId: string) => {
    if (!allOptions[optionId]) {
      console.error(`Option with ID "${optionId}" is missing in allOptions.`);
      return;
    }

    if (chartRef.current) {
      const instance = chartRef.current.getEchartsInstance();
      const currentOption = instance.getOption();
      optionStack.push(currentOption.id as string); // Push current option ID
      // Check if transitioning to a distribution_types chart
      if (optionId.startsWith("scat_")) {
        // Make a safe copy of the current option (if it doesn't exist)
        if (!allOptions[currentOption.id + "_copy"]) {
          const safeCopy = JSON.parse(JSON.stringify(currentOption));
          safeCopy.id = currentOption.id + "_copy";
          // Ensure onclick event is present
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
              onclick: () => goBack(), // Ensure this is correctly set
            },
          ];

          allOptions[safeCopy.id] = safeCopy;
        }

        const l_child_identifiers_per_bin =
          currentOption.dataset[0]?.source?.map(
            (item) => item.child_identifier_per_bin
          );

        currentOption.series.forEach((s) => {
          if (l_child_identifiers_per_bin) {
            s.universalTransition = s.universalTransition || {}; // Ensure object exists
            s.universalTransition.seriesKey = l_child_identifiers_per_bin; // Set seriesKey dynamically
          }
        });
        // Update the current option with merged options
        try {
          instance.setOption(currentOption, { notMerge: false, silent: true });
          allOptions[currentOption.id] = instance.getOption();
        } catch (error) {
          console.log("Prevent graph update");
          // instance.setOption(safeCopy, true);
          //allOptions[currentOption.id] = instance.getOption();
        }
      }

      // Move to the next
      console.log(`Navigating to optionId: ${optionId}`);
      try {
        const option = allOptions[optionId];
        instance.setOption(option, true); // Apply the updated option
      } catch (error) {
        console.log("Error updating graph");
        console.log("Falling back to safe copy first");
        optionId = optionId + "_copy";
        const safeCopy = allOptions[optionId];
        instance.setOption(safeCopy, true); // Apply the updated option
      }
    }
  };

  const goBack = () => {
    console.log("Going back...");
    if (chartRef.current && optionStack.length > 0) {
      console.log(
        "Current graph id:",
        chartRef.current.getEchartsInstance().getOption().id
      );
      const instance = chartRef.current.getEchartsInstance();
      const previousOptionId = optionStack.pop()!;
      const option = allOptions[previousOptionId];
      const currentOption = instance.getOption();

      // Remove seriesKey if transitioning back from distribution_types
      if (previousOptionId.endsWith("_submission")) {
        // Ensure `series` is an array
        const seriesArray = Array.isArray(currentOption.series)
          ? currentOption.series
          : [currentOption.series];

        seriesArray.forEach((s) => {
          if (s.universalTransition) {
            delete s.universalTransition.seriesKey; // Clear seriesKey
          }
        });
        currentOption.series = seriesArray;
        allOptions[option.Id] = currentOption;
        console.log("previous option:", currentOption);
        instance.setOption(currentOption, true); // Apply the updated option
      }

      console.log(`Navigating back to optionId: ${previousOptionId}`);
      console.log("current option:", option);

      instance.setOption(option, true); // Apply the updated option
    } else {
      console.log("Already at root level!");
    }
  };

  const onChartClick = (params: any) => {
    const dataItem = params.data;
    if (dataItem?.child_identifier) {
      const nextOptionId = dataItem.child_identifier;
      goForward(nextOptionId);
    }
  };

  const onEvents = {
    click: onChartClick,
  };

  return (
    <ReactECharts
      ref={chartRef}
      option={option_1}
      style={{ height: "1000px", width: "100%" }}
      opts={{ renderer: "canvas" }}
      theme="light"
      onEvents={onEvents}
    />
  );
};

export default Page;
