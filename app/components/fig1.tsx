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
    toolbox: {
      show: true,
      feature: {
        saveAsImage: {},
      },
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
        "name",
        "count",
        "identifier",
        "child_identifier",
        "percent_2023",
      ],
      source: game_counts,
    },
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
          // divideShape: "clone",
        },
        label: {
          show: true,
          position: "inside",
          // show category name
          // formatter: function (params: unknown) {
          //   return params.data["category1"];
          // },
        },
      },
    ],
  };
  allOptions[game_counts[0]["identifier"]] = option_1;

  // Add options for submission types
  submission_types.forEach((data, index) => {
    // since dataItems of each data have same groupId in this
    // example, we can use groupId as optionId for optionStack.
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
      toolbox: {
        show: true,
        feature: {
          saveAsImage: {},
        },
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
    // since dataItems of each data have same groupId in this
    // example, we can use groupId as optionId for optionStack.
    const optionId = data[0]["identifier"];

    // Get the list of all "child_identifier_per_bin"
    const l_child_identifiers_per_bin = data.map(
      (item) => item["child_identifier_per_bin"]
    );

    const option = {
      id: optionId,
      title: {
        text: "Distribution of speedrun times for category X of game X",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: function (params: unknown) {
          return [
            "Bin: " + params[0].data["bin_label"],
            "Submissions: " + params[0].data["count_all"],
            "% of submissions in 2023: " +
              parseFloat(params[0].data["percent_2023"]).toFixed(1) +
              "%",
          ].join("<br/>");
        },
      },
      grid: {
        left: 250,
      },
      toolbox: {
        show: true,
        feature: {
          saveAsImage: {},
        },
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
          itemGroupId: "identifier", // "child_identifier_per_bin", //
          itemChildGroupId: "child_identifier_per_bin", // "child_identifier"
        },
        universalTransition: {
          enabled: true,
          // seriesKey: l_child_identifiers_per_bin,
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
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;

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

        //   // Update min and max values for x and y
        //   l_runs.forEach((run) => {
        //     const date = new Date(run[0]).getTime();
        //     const time = run[1];
        //     if (date < minX) minX = date;
        //     if (date > maxX) maxX = date;
        //     if (time < minY) minY = time;
        //     if (time > maxY) maxY = time;
        //   });
      }

      allOptions[optionId] = {
        id: optionId,
        title: {
          text: "Speedrun times for category X of game X",
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
          formatter: function (params: unknown) {
            return [
              "Date: " + params[0].data[0],
              "Run time: " + params[0].data[1],
              "Player: " + params[0].data[2],
              "Location: " + params[0].data[3],
            ].join("<br/>");
          },
        },
        grid: {
          left: 250,
        },
        toolbox: {
          show: true,
          feature: {
            saveAsImage: {},
          },
        },
        yAxis: {
          type: "value",
          name: "Speedrun time",
          //min: minY,
          //max: maxY,
        },
        xAxis: {
          type: "time",
          name: "Date",
          //min: minX,
          //max: maxX,
        },
        visualMap: {
          orient: "horizontal",
          left: "center",
          text: ["Test"],
          // Map the score column to color
          dimension: "time",
          inRange: {
            color: ["#65B581", "#FFCE34", "#FD665F"],
          },
          min: 0,
          max: 1000,
        },
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
      console.log(`Navigating to optionId: ${optionId}`);
      instance.setOption(allOptions[optionId], true);
    }
  };

  const goBack = () => {
    if (chartRef.current && optionStack.length > 0) {
      const instance = chartRef.current.getEchartsInstance();
      const previousOptionId = optionStack.pop()!;
      instance.setOption(allOptions[previousOptionId], true);
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
