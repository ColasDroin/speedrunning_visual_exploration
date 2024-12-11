"use client";

import React, { useRef } from "react";
import ReactECharts from "echarts-for-react";
import game_counts from "../../public/data/game_counts.json";
import submission_types from "../../public/data/submission_types.json";
import distribution_types from "../../public/data/distribution_types.json";
import pako from "pako";

let scatter_data: any[] = [];
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
fetch(`${baseUrl}/data/scatter_data.json.gz`)
  .then((response) => response.arrayBuffer())
  .then((buffer) => {
    const decompressed = pako.inflate(new Uint8Array(buffer), { to: "string" });
    scatter_data = JSON.parse(decompressed);
  });

// Compute min and max for a dataset
function computeMinMax(data) {
  const values = data.map((item) => item[1]); // Assuming the second column is the score
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

const Page: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  type EChartsOption = echarts.EChartsOption;
  const allOptions: { [key: string]: EChartsOption } = {};
  const optionStack: string[] = []; // Stack to track navigation
  let option_1: EChartsOption;
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
      yAxis: {
        type: "value",
        name: "Submission count per category",
        axisLabel: {
          formatter: "{value}",
        },
      },
      xAxis: {
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
          "percent_2023",
        ],
        source: data,
      },
      series: {
        type: "bar",
        encode: {
          y: "count_all",
          x: "bin_label",
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

  for (const data of Object.entries(scatter_data)) {
    const dic_per_bin = data[1];
    const optionId = data[0];
    const l_series = [];
    for (const [bin_id, l_runs] of Object.entries(dic_per_bin)) {
      l_series.push({
        type: "scatter",
        dimensions: ["date", "time", "player", "location"],
        data: l_runs,
        groupId: bin_id,
        encode: {
          x: "date",
          y: "time",
        },
        universalTransition: {
          enabled: true,
        },
      });
    }

    const option = {
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
            "Date: " + params[0].data["date"],
            "Run time: " + params[0].data["time"],
            "Player: " + params[0].data["player"],
            "Location: " + params[0].data["location"],
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
        type: "time",
        name: "Speedrun time",
      },
      xAxis: {
        type: "time",
        name: "Date",
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
    allOptions[optionId] = option;
    // console.log("ICI MAINTENANT", allOptions);
  }

  const goForward = (optionId: string) => {
    if (chartRef.current) {
      const instance = chartRef.current.getEchartsInstance();
      const currentOption = instance.getOption();
      optionStack.push(currentOption.id as string); // Push current option ID
      instance.setOption(allOptions[optionId]);
    }
  };

  const goBack = () => {
    if (chartRef.current && optionStack.length > 0) {
      const instance = chartRef.current.getEchartsInstance();
      const previousOptionId = optionStack.pop()!;
      instance.setOption(allOptions[previousOptionId]);
    } else {
      console.log("Already at root level!");
    }
  };

  const onChartClick = (params: any) => {
    const dataItem = params.data;
    if (dataItem?.child_identifier) {
      const nextOptionId = dataItem.child_identifier;
      console.log("Next option ID:", nextOptionId);
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
