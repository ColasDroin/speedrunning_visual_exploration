"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import top_games_data from "../../public/data/top_games_data.json";
import { count } from "console";

const Page: React.FC = () => {
  const ROOT_PATH = "https://echarts.apache.org/examples";
  type EChartsOption = echarts.EChartsOption;
  let options: EChartsOption;

  const uniqueGames = Array.from(
    new Set(top_games_data.map((item) => item.name))
  );

  const weatherIcons = {
    Sunny: ROOT_PATH + "/data/asset/img/weather/sunny_128.png",
    Cloudy: ROOT_PATH + "/data/asset/img/weather/cloudy_128.png",
    Showers: ROOT_PATH + "/data/asset/img/weather/showers_128.png",
  } as const;

  const seriesLabel = {
    show: true,
  } as const;

  options = {
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
          "Release Date: " + params[0].data["releaseDate"],
          "Platform: " + params[0].data["platform_name"],
          "Total Submissions: " + params[0].data["sum_count"],
          "Category 1: " + params[0].data["category1"],
          "Category 2: " + params[0].data["category2"],
          "Category 3: " + params[0].data["category3"],
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
    dataset: {
      dimensions: [
        "name",
        "releaseDate",
        "platform_name",
        "sum_count",
        "category1",
        "category2",
        "category3",
        "count1",
        "count2",
        "count3",
      ],
      source: top_games_data,
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
    series: [
      {
        type: "bar",
        encode: {
          x: ["count1"],
          y: ["name"],
        },
        label: {
          show: true,
          position: "inside",
          // show category name
          formatter: function (params: unknown) {
            return params.data["category1"];
          },
        },
      },
      {
        type: "bar",
        encode: {
          x: ["count2"],
          y: ["name"],
        },
        label: {
          show: true,
          position: "inside",
          // show category name
          formatter: function (params: unknown) {
            return params.data["category2"];
          },
        },
      },
      {
        type: "bar",
        encode: {
          x: ["count3"],
          y: ["name"],
        },
        label: {
          show: true,
          position: "inside",
          // show category name
          formatter: function (params: unknown) {
            return params.data["category3"];
          },
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={options}
      style={{ height: "1000px", width: "100%" }}
      opts={{ renderer: "canvas" }}
      theme={"light"}
    />
  );
};

export default Page;
