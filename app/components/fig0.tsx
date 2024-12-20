"use client";
// Import necessary libraries
import React, { useRef, useEffect, useState } from "react";
import { throttle } from "lodash"; // Import throttle function
import ReactECharts from "echarts-for-react";
import dataCategories from "../../public/data/categories.json";

const Page: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  const [option, setOption] = useState<echarts.EChartsOption | null>(null);
  const [scrollDepth, setScrollDepth] = useState(0); // Track scroll depth

  useEffect(() => {
    const handleScroll = throttle(() => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.scrollHeight;
      const maxDepth = 10;
      const newDepth = Math.min(
        maxDepth,
        Math.floor(
          (scrollPosition / (documentHeight - windowHeight)) * maxDepth
        )
      );
      setScrollDepth(newDepth); // Update the scroll depth
    }, 500); // Throttle to update at most every 100ms

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);

    return () => {
      // Clean up the event listener
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
          { name: "Super Mario 64", icon: "rectangle" },
          { name: "Portal", icon: "rectangle" },
          { name: "MineCraft: Java Edition", icon: "rectangle" },
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
          orient: "vertical",
          symbol: "emptyCircle",
          symbolSize: 7,
          initialTreeDepth: scrollDepth, // Adjust depth dynamically
          animationDurationUpdate: 750,
          expandAndCollapse: true,
          emphasis: { focus: "descendant" },
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
          orient: "vertical",
          symbol: "emptyCircle",
          symbolSize: 7,
          initialTreeDepth: scrollDepth, // Adjust depth dynamically
          animationDurationUpdate: 750,
          emphasis: { focus: "descendant" },
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
          orient: "vertical",
          symbol: "emptyCircle",
          symbolSize: 7,
          initialTreeDepth: scrollDepth, // Adjust depth dynamically
          animationDurationUpdate: 750,
          emphasis: { focus: "descendant" },
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
  }, [scrollDepth]); // Update chart when scroll depth changes

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
