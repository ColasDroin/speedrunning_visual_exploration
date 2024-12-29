"use client";

import React, { useRef, useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import scatterZelda from "../../public/data/scatter_zelda.json";
type EChartsOption = echarts.EChartsOption;

const Page: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    // Check if running in the browser
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setIsSmallScreen(window.innerWidth < 768);
      };

      handleResize(); // Run initially to set the correct size
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);
  const [showBestLine, setShowBestLine] = useState(false);
  const [showBestTimeBox, setShowBestTimeBox] = useState(false); // New state for Best Time box
  const [isPulsating, setIsPulsating] = useState(false);
  const fontSize = isSmallScreen ? 12 : 18;
  const heightGraph = isSmallScreen ? "500px" : "700px";

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h}h ${m}m ${s}s ${ms}ms`;
  };

  const createZeldaScatterOption = (showBestLine: boolean): EChartsOption => {
    const optionId = Object.keys(scatterZelda)[0];
    const [dic_per_bin, best_line, true_ID] = scatterZelda[optionId];

    const l_series = Object.entries(dic_per_bin).map(
      ([bin_id, l_runs]: any) => ({
        type: "scatter",
        dimensions: ["date", "time", "player", "location"],
        data: l_runs,
        dataGroupId: bin_id,
        id: bin_id,
        encode: { x: "date", y: "time" },
        symbol: "diamond",
        symbolSize: (data, params) => {
          const baseSize = 8; // Base size
          const randomFactor = Math.random() * 4; // Randomize initial size
          const waveFrequency = 0.1; // Wave frequency
          const timeFactor = Date.now() / 1000; // Time-based oscillation

          return (
            baseSize +
            randomFactor +
            Math.sin(waveFrequency * (params.dataIndex + timeFactor)) * 4
          );
        },
        itemStyle: {
          color: {
            type: "radial",
            x: 0.5,
            y: 0.5,
            r: 0.8,
            colorStops: [
              { offset: 0, color: "rgba(255, 255, 255, 1)" }, // Bright center
              { offset: 0.5, color: "rgba(216, 206, 146, 0.8)" }, // Golden glow
              { offset: 1, color: "rgba(255, 215, 0, 0)" }, // Fade to transparent
            ],
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 30,
            shadowColor: "rgba(255, 255, 255, 1)",
          },
        },
        animationDuration: 2000,
        z: 2,
      })
    );

    if (showBestLine) {
      l_series.push({
        type: "line",
        data: best_line,
        encode: { x: 0, y: 1 },
        lineStyle: { color: "yellow", width: 2 },
        animationDuration: 3000,
        symbol: "none",
        tooltip: { show: false },
        z: 1,
      });
    }

    const yValues = best_line.map((item: [string, number]) => item[1]);
    const xValues = best_line.map((item: [string]) =>
      new Date(item[0]).getTime()
    );
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);

    // Calculate the best time (minimum time)
    const bestTime = Math.min(...yValues);
    const formattedBestTime = formatTime(bestTime);

    return {
      id: optionId,
      backgroundColor: "transparent", // Changed to transparent for better integration
      title: {
        text: isSmallScreen
          ? "Speedrun times for category 100% of \nThe Legend of Zelda: Breath of the Wild"
          : "Speedrun times for category 100% of The Legend of Zelda: Breath of the Wild",
        textStyle: {
          color: "white",
          width: "90%",
          overflow: "break",
          fontSize: fontSize,
        },
        left: "center",
      },
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
      grid: { left: 120 },
      yAxis: {
        type: "value",
        name: "Speedrun time",
        nameTextStyle: { color: "white" },
        axisLabel: {
          formatter: (value: number) => formatTime(value),
          color: "white",
        },
        min: yMin,
        max: yMax,
      },
      xAxis: {
        type: "time",
        name: "Date",
        nameTextStyle: { color: "white" },
        axisLabel: { color: "white" },
      },
      graphic: [
        {
          type: "image",
          id: "background",
          left: "48%", // Adjusted position
          top: "30%", // Adjusted position
          z: 0, // Ensure it is behind all other elements
          style: {
            image: `images/${true_ID}_icon_rescaled.webp`,
            width: 150,
            height: 150,
            opacity: 0.3, // Makes it look subtle and carved
          },
        },
        // Conditionally render the Best Time box
        showBestTimeBox && {
          type: "group",
          left: isSmallScreen ? "40%" : "20%", // Position at the right 20% if small screen
          top: isSmallScreen ? "15%" : "auto", // Position at the top 15% if small screen
          bottom: isSmallScreen ? "auto" : "15%", // Adjust as needed
          z: 10, // Ensure it's above scatter points
          silent: true, // Make the graphic non-clickable
          children: [
            {
              type: "rect",
              shape: {
                width: isSmallScreen ? 150 : 200,
                height: isSmallScreen ? 30 : 50,
              },
              style: {
                fill: "rgba(0, 0, 0, 0.6)", // Semi-transparent background
                stroke: "#00FF00", // Green border for video game feel
                lineWidth: 2,
                shadowBlur: 10,
                shadowColor: "#00FF00",
                // Optional: Add rounded corners
                // Define borderRadius if desired
                // borderRadius: [10, 10, 10, 10],
              },
              z: 0,
            },
            {
              type: "text",
              style: {
                text: `Best Time: ${formattedBestTime}`,
                x: isSmallScreen ? 75 : 100, // Center the text
                y: isSmallScreen ? 15 : 25, // Center the text
                textAlign: "center",
                textVerticalAlign: "middle",
                fill: "#00FF00", // Green text color
                font: 'bold 0.5em "Press Start 2P", cursive', // Pixel-style font
                // If "Press Start 2P" is not available, use a default monospace font
                // font: 'bold 16px monospace',
                // Add a glow effect using shadow
                textShadowColor: "#00FF00",
                textShadowBlur: 4,
              },
              z: 1,
            },
          ],
        },
      ].filter(Boolean), // Remove falsey values
      animationDurationUpdate: 500,
      animationEasingUpdate: "linear",
      animationEasing: "linear",
      animationDelay: 0,
      animationThreshold: 20000,
      progressive: 20000,
      progressiveThreshold: 20000,
      series: l_series,
    };
  };

  const pulsateStars = () => {
    if (!chartRef.current) return;

    const chartInstance = chartRef.current.getEchartsInstance();

    setInterval(() => {
      chartInstance.setOption({
        series: chartInstance.getOption().series.map((series: any) =>
          series.type === "scatter"
            ? {
                ...series,
                symbolSize: (data, params) => {
                  const baseSize = 6; // Base size
                  const randomFactor = Math.random() * 4; // Randomize initial size
                  const waveFrequency = 2; // Wave frequency
                  const timeFactor = Date.now() / 1000; // Time-based oscillation

                  return (
                    baseSize +
                    randomFactor +
                    Math.sin(waveFrequency * (params.dataIndex + timeFactor)) *
                      4
                  );
                },
              }
            : series
        ),
      });
    }, 500);
  };

  useEffect(() => {
    if (!isPulsating) {
      pulsateStars();
      setIsPulsating(true);
    }
  }, [isPulsating]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShowBestLine(true);
          }
        });
      },
      { threshold: 0.5 } // Trigger when 50% of the chart is visible
    );

    if (chartRef.current) {
      const dom = chartRef.current.getEchartsInstance().getDom();
      observer.observe(dom);
    }

    return () => {
      if (chartRef.current) {
        const dom = chartRef.current.getEchartsInstance().getDom();
        observer.unobserve(dom);
      }
    };
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (showBestLine) {
      // Set a timeout matching the line animation duration (3000ms)
      timeoutId = setTimeout(() => {
        setShowBestTimeBox(true);
      }, 0);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [showBestLine]);

  const defaultZeldaOption = createZeldaScatterOption(showBestLine);

  return (
    <ReactECharts
      ref={chartRef}
      option={defaultZeldaOption}
      style={{ height: heightGraph, width: "100%" }}
      opts={{ renderer: "canvas" }}
      theme="dark" // Changed theme to dark for better contrast
    />
  );
};

export default Page;
