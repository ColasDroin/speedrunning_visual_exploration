"use client";
// Import necessary libraries
import React, { useRef, useEffect, useState } from "react";
import { throttle } from "lodash"; // Import throttle function
import ReactECharts from "echarts-for-react";
import dataCategories from "../../public/data/categories.json";
import { marked } from "marked";

const Page: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  const [option, setOption] = useState<echarts.EChartsOption | null>(null);
  const [scrollDepth, setScrollDepth] = useState(0); // Track scroll depth
  const previousDepthRef = useRef<number>(0); // Track the previous depth

  useEffect(() => {
    const handleScroll = throttle(() => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.scrollHeight;
      const maxDepth = 3;
      const newDepth = Math.min(
        maxDepth,
        Math.floor(
          (scrollPosition / (documentHeight - windowHeight)) * maxDepth * 4
        )
      );
      setScrollDepth(newDepth); // Update the scroll depth
    }, 1200); // Throttle to update at most every 100ms

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);

    return () => {
      // Clean up the event listener
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    // Avoid redundant updates if scrollDepth hasn't changed
    // if (scrollDepth === previousDepthRef.current) return;

    // Update the reference to the current depth
    previousDepthRef.current = scrollDepth;

    const chartOption: echarts.EChartsOption = {
      tooltip: {
        trigger: "item",
        triggerOn: "mousemove",
        formatter: (params) => {
          if (params && params.name) {
            if (params.value && params.data.depth === 1) {
              const parsedValue = marked(params.value);
              return `
                <div style="text-align: left;">
                <strong style="font-size: 14px;">Category: ${params.name}</strong><br />
                <span style="font-size: 12px;">${parsedValue}</span>
                </div>
              `;
            } else if (params.value && params.data.depth === 2) {
              const parsedValue = marked(params.value);
              return `
                <div style="text-align: left;">
                <strong style="font-size: 14px;">Level: ${params.name}</strong><br />
                <span style="font-size: 12px;">${parsedValue}</span>
                </div>
              `;
            } else if (params.data.depth === 1) {
              return `
                <div style="text-align: left;">
                <strong style="font-size: 14px;">Category: ${params.name}</strong><br />
                </div>
              `;
            } else if (params.data.depth === 2) {
              return `
                <div style="text-align: left;">
                <strong style="font-size: 14px;">Level: ${params.name}</strong><br />
                </div>
              `;
            }
            return `
              <div style="text-align: left;">
              <strong style="font-size: 14px;">${params.name} (${params.data.platform})</strong><br />
              </div>
            `;
          }
          return ""; // Return an empty string if params or params.name are undefined
        },
        extraCssText: `
          max-width: 33vw !important;  /* Limit the tooltip width to 33% of the viewport */
          white-space: normal !important;  /* Allow text to wrap inside the tooltip */
          word-wrap: break-word;  /* Break long words into the next line */
          overflow: hidden !important;  /* Hide overflow content */
        `,
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
          name: "Portal",
          data: [dataCategories["portal"]],
          top: "10%",
          bottom: "10%",
          left: "10%",
          right: "10%",
          // orient: "vertical",
          symbol: "emptyCircle",
          layout: "radial",
          symbolSize: 7,
          initialTreeDepth: scrollDepth, // Adjust depth dynamically
          animationDurationUpdate: 750,
          emphasis: { focus: "descendant" },
          // label: {
          //   position: "top",
          //   rotate: -90,
          //   verticalAlign: "middle",
          //   align: "right",
          //   fontSize: 15,
          // },
          // leaves: {
          //   label: {
          //     position: "bottom",
          //     rotate: -90,
          //     verticalAlign: "middle",
          //     align: "left",
          //   },
          // },
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
