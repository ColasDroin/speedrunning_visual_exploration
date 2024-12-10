"use client";

import React, { useRef } from "react";
import ReactECharts from "echarts-for-react";
import game_counts from "../../public/data/game_counts.json";
import submission_types from "../../public/data/submission_types.json";

const Page: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  type EChartsOption = echarts.EChartsOption;
  const allOptions: { [key: string]: EChartsOption } = {};
  const optionStack: string[] = []; // Stack to track navigation
  let option_1: EChartsOption;
  console.log(game_counts);
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
    animationDurationUpdate: 500,
    dataset: {
      dimensions: ["name", "count", "identifier", "child_identifier"],
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
          divideShape: "clone",
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
            "Total Submissions: " + params[0].data["count"],
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
      animationDurationUpdate: 500,
      dataset: {
        dimensions: [
          "name_category",
          "count",
          "identifier",
          "child_identifier",
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
          divideShape: "clone",
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
