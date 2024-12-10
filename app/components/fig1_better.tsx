"use client";

import React, { useRef } from "react";
import ReactECharts from "echarts-for-react";
import game_counts from "../../public/data/game_counts.json";
import submission_types from "../../public/data/submission_types.json";
import distribution_types from "../../public/data/distribution_types.json";

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
