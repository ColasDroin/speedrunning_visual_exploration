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

  // Define a list of predefined colors
  const predefinedColors = [
    "#FF5733", // Red
    "#33FF57", // Green
    "#3357FF", // Blue
    "#FF33A6", // Pink
    "#FFFF33", // Yellow
    "#33FFF7", // Cyan
    "#FF9333", // Orange
    "#9B33FF", // Purple
    "#FF5733", // Red (again, for more categories)
    "#7FFF33", // Lime
  ];

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

    // Function to create a custom image with circle border
    const createImageWithCircleBorder = (
      size: number,
      borderColor: string,
      imageName: string
    ) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        const image = new Image();
        image.onload = () => {
          // Set canvas size to be large enough to fit the circle and image
          canvas.width = size + 10; // Adding space for the border (smaller than before)
          canvas.height = size + 10; // Adding space for the border (smaller than before)

          // Draw the border around the circle first, exactly around the image
          ctx.beginPath();
          ctx.arc(
            canvas.width / 2,
            canvas.height / 2,
            size / 2 + 2,
            0,
            Math.PI * 2
          ); // Circle with smaller border
          ctx.lineWidth = 5;
          ctx.strokeStyle = borderColor;
          ctx.stroke();
          ctx.closePath();

          // Now clip the canvas to a circle for the image
          ctx.beginPath();
          ctx.arc(
            canvas.width / 2,
            canvas.height / 2,
            size / 2,
            0,
            Math.PI * 2
          ); // Circle clipping path
          ctx.clip(); // Apply the clip

          // Draw the dolphin image inside the clipped area
          ctx.drawImage(
            image,
            canvas.width / 2 - size / 2, // Position the image (center it)
            canvas.height / 2 - size / 2, // Position the image (center it)
            size, // Image width
            size // Image height
          );

          // Convert the canvas to a data URL
          const dataUrl = canvas.toDataURL("image/png");
          const customImage = new Image();
          customImage.src = dataUrl;
          customImage.onload = () => resolve(customImage);
        };
        image.onerror = reject;

        // Set the source of the image to be the dolphin image
        image.src = "images/" + imageName + "_cover.webp";
      });
    };

    const customImages = await Promise.all(
      networkData.nodes.map(async (node: RawNode) => {
        const colorIndex = node.category % predefinedColors.length; // Map the category index to the color list
        const categoryColor = predefinedColors[colorIndex]; // Get the color for this category
        const size = node.size / 10 + 10; // Size of the node

        // Create the custom image with circle border
        const dataUrl = await createImageWithCircleBorder(
          size,
          categoryColor,
          node.real_id
        );
        return "image://" + dataUrl.src; // Use the data URL for the symbol
      })
    );

    // Create the new chart option
    const newOption: echarts.EChartsOption = {
      title: {
        text: "Game communities",
      },
      animationDurationUpdate: 1500,
      animationEasingUpdate: "quinticInOut",
      tooltip: {},
      legend: [
        {
          data: networkData.categories.map(function (a) {
            // Map each category to the predefined color
            const colorIndex = a.id % predefinedColors.length;
            return {
              name: a.name,
              itemStyle: {
                color: predefinedColors[colorIndex], // Set the color for the legend
              },
            };
          }),
        },
      ],
      series: [
        {
          type: "graph",
          layout: "circular",
          circular: {
            rotateLabel: true,
          },
          categories: networkData.categories,
          data: networkData.nodes.map((node: RawNode, index: number) => ({
            id: node.id,
            name: node.id,
            symbol: customImages[index], // Use an image as the symbol
            symbolSize: node.size / 10,
            x: node.x,
            y: node.y,
            category: node.category,
            label: {
              show: node.size > 300 ? true : false,
              formatter: (params: any) => {
                return params.data.id;
              },
            },
            emphasis: {
              // Place emphasis on each node directly
              label: {
                show: true, // Ensure the label is shown on hover
                fontSize: 14,
                fontWeight: "bold",
                formatter: (params: any) => params.data.id, // Optional formatter
              },
              scale: 1.1,
            },
            // itemStyle: {
            //   borderColor: "red", // Set the border color to match the category color
            //   borderWidth: 30, // Set the border width
            //   borderType: "solid", // Set the border type
            //   color: "blue", // Set the node color
            // },
          })),
          edges: networkData.edges.map((edge: RawEdge) => ({
            source: edge.source,
            target: edge.target,
            lineStyle: {
              width: Math.max(1, edge.scaled_edge_weight / 10),
              curveness: 0.3,
              opacity: 0.2,
              color: "source",
            },
            value: edge.weight,
            emphasis: {
              lineStyle: {
                width: Math.max(10, edge.scaled_edge_weight / 10), // Emphasize with thicker line
                opacity: 1, // Make edge fully opaque
              },
            },
          })),
          emphasis: {
            focus: "adjacency",
            label: {
              show: true, // Ensure adjacent node labels appear
              fontWeight: "bold",
            },
          },

          tooltip: {
            formatter: (params: any) => {
              // console.log("Params:", params);
              if ("name" in params.data) {
                return;
              } else {
                return (
                  "Common runners between\n" +
                  "<b>" +
                  params.data.source +
                  "</b>" +
                  " and " +
                  "<b>" +
                  params.data.target +
                  "</b>" +
                  ":" +
                  "<b>" +
                  params.data.value +
                  "</b>"
                );
              }
            },
            extraCssText:
              "max-width: 200px; white-space: normal; word-wrap: break-word;",
          },
          roam: false,
        },
      ],
    };

    // console.log("Prepared nodes:", networkData.nodes);
    // console.log("Prepared edges:", networkData.edges);
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
