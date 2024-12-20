"use client";
// Import necessary libraries
import React, { useRef, useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import dataCategories from "../../public/data/categories.json";

const Page: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  const [option, setOption] = useState<echarts.EChartsOption | null>(null);

  useEffect(() => {
    const chartOption: echarts.EChartsOption = {
      tooltip: {
        trigger: "item",
        triggerOn: "mousemove",
      },
      legend: {
        show: false,
        top: "2%",
        left: "3%",
        orient: "vertical",
        data: [
          {
            name: "Super Mario 64",
            icon: "rectangle",
          },
          {
            name: "Portal",
            icon: "rectangle",
          },
          {
            name: "MineCraft: Java Edition",
            icon: "rectangle",
          },
        ],
        borderColor: "#c23531",
      },
      series: [
        {
          type: "tree",
          name: "Super Mario 64",
          data: [dataCategories["mario"]],
          top: "20%",
          bottom: "25%",
          left: "1%",
          right: "77%",
          //layout: "radial",
          orient: "vertical",
          symbol: "emptyCircle",
          symbolSize: 7,
          initialTreeDepth: 3,
          animationDurationUpdate: 750,
          expandAndCollapse: true,
          emphasis: {
            focus: "descendant",
          },
          label: {
            position: "top",
            rotate: -90,
            verticalAlign: "middle",
            align: "right",
            fontSize: 15,
          },
          leaves: {
            label: {
              position: "bottom",
              rotate: -90,
              verticalAlign: "middle",
              align: "left",
            },
          },
        },
        {
          type: "tree",
          name: "Portal",
          data: [dataCategories["portal"]],
          top: "20%",
          bottom: "25%",
          left: "23%",
          right: "20%",
          //layout: "radial",
          orient: "vertical",
          symbol: "emptyCircle",
          symbolSize: 7,
          initialTreeDepth: 3,
          animationDurationUpdate: 750,
          emphasis: {
            focus: "descendant",
          },
          label: {
            position: "top",
            rotate: -90,
            verticalAlign: "middle",
            align: "right",
            fontSize: 15,
          },
          leaves: {
            label: {
              position: "bottom",
              rotate: -90,
              verticalAlign: "middle",
              align: "left",
            },
          },
        },
        {
          type: "tree",
          name: "MineCraft: Java Edition",
          data: [dataCategories["minecraft"]],
          top: "20%",
          bottom: "52%",
          left: "80%",
          right: "1%",
          //layout: "radial",
          orient: "vertical",
          symbol: "emptyCircle",
          symbolSize: 7,
          initialTreeDepth: 2,
          animationDurationUpdate: 750,
          emphasis: {
            focus: "descendant",
          },
          label: {
            position: "top",
            rotate: -90,
            verticalAlign: "middle",
            align: "right",
            fontSize: 15,
          },
          leaves: {
            label: {
              position: "bottom",
              rotate: -90,
              verticalAlign: "middle",
              align: "left",
            },
          },
        },
      ],
    };

    setOption(chartOption);
  }, []); // The empty dependency array ensures this runs only once

  return (
    <ReactECharts
      ref={chartRef}
      option={option || {}} // Render an empty chart initially
      style={{ height: "800px", width: "100%" }}
      opts={{ renderer: "canvas" }}
      theme="dark"
    />
  );
};

export default Page;
