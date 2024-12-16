"use client";
// Import necessary libraries
import React, { useRef, useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import pako from "pako";
// import networkData from "../../public/data/network_data.json";

const Page: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  const [option, setOption] = useState<echarts.EChartsOption | null>(null);

  interface RawNode {
    id: string;
    players: number;
    x: number;
    y: number;
    size: number;
    community: number;
  }

  interface RawEdge {
    source: string;
    target: string;
    weight: number;
    scaled_edge_weight: number;
  }

  // Function to prepare scatter options
  const prepareGraph = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    let networkData: any[] = [];

    // Fetch and decompress scatter data
    try {
      const response = await fetch(`${baseUrl}/data/network_data.json.gz`);
      const buffer = await response.arrayBuffer();
      const decompressed = pako.inflate(new Uint8Array(buffer), {
        to: "string",
      });
      networkData = JSON.parse(decompressed);
    } catch (error) {
      console.error("Error fetching scatter data:", error);
      return;
    }

    // Create the new chart option
    const newOption: echarts.EChartsOption = {
      title: {
        text: "Game communities",
      },
      animationDurationUpdate: 1500,
      animationEasingUpdate: "quinticInOut",
      series: [
        {
          type: "graph",
          layout: "none",
          data: networkData.nodes.map((node: RawNode) => ({
            id: node.id,
            name: node.name,
            symbolSize: node.size / 50,
            x: node.x,
            y: node.y,
            category: node.community,
            itemStyle: {
              color: (() => {
                switch (node.community) {
                  case 0:
                    return "#ff0000"; // Red
                  case 1:
                    return "#00ff00"; // Green
                  case 2:
                    return "#0000ff"; // Blue
                  case 3:
                    return "#ffff00"; // Yellow
                  case 4:
                    return "#ff00ff"; // Magenta
                  case 5:
                    return "#00ffff"; // Cyan
                  default:
                    return "#ffffff"; // White
                }
              })(),
            },
          })),
          edges: networkData.edges.map((edge: RawEdge) => ({
            source: edge.source,
            target: edge.target,
            // lineStyle: { width: edge.scaled_edge_weight },
            // value: edge.weight,
          })),
          emphasis: {
            focus: "adjacency",
            label: {
              position: "right",
              show: true,
            },
          },
          tooltip: {
            formatter: (params: any) => {
              return params.data.name;
            },
          },
          roam: true,
        },
      ],
    };

    console.log("Prepared nodes:", networkData.nodes);
    console.log("Prepared edges:", networkData.edges);
    // Update the chart option state
    setOption(newOption);
  };

  // Use effect to prepare options and initialize the chart
  useEffect(() => {
    prepareGraph();
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <ReactECharts
      ref={chartRef}
      option={option || {}} // Render an empty chart initially
      style={{ height: "1000px", width: "100%" }}
      opts={{ renderer: "canvas" }}
      theme="dark"
    />
  );
};

export default Page;
