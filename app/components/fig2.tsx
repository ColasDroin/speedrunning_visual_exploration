"use client";
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import ReactECharts from "echarts-for-react";
import pako from "pako";

interface RawNode {
  real_id: string;
  id: string;
  players: number;
  x: number;
  y: number;
  size: number;
  community: number;
  category: number; // 0-based
}

interface RawEdge {
  source: string;
  target: string;
  weight: number;
  scaled_edge_weight: number;
}

interface Category {
  id: number; // 0-based
  name: string;
}

interface NetworkData {
  nodes: RawNode[];
  edges: RawEdge[];
  categories: Category[];
}

// Adjust as needed:
const CENTER_TOLERANCE = 50; // how close centers must be to lock
const DEBOUNCE_INTERVAL = 1500; // ms wait before revealing next category
const STARTING_CATEGORIES = 1; // categories visible at start

// Colors for categories
const predefinedColors = [
  "#FF5733", // Red
  "#33FF57", // Green
  "#3357FF", // Blue
  "#FF33A6", // Pink
  "#FFFF33", // Yellow
  "#33FFF7", // Cyan
  "#FF9333", // Orange
  "#9B33FF", // Purple
  "#FF5733", // Red (again)
  "#7FFF33", // Lime
];

const Page: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  // Store the entire network data once fetched
  const [allNetworkData, setAllNetworkData] = useState<NetworkData | null>(
    null
  );

  // Current ECharts option for the partial reveal
  const [option, setOption] = useState<echarts.EChartsOption | null>(null);

  // How many categories have been revealed
  const [revealedCategories, setRevealedCategories] =
    useState(STARTING_CATEGORIES);

  // Whether the scroll is currently locked
  const [scrollLocked, setScrollLocked] = useState(false);

  // Has the user revealed all categories? If so, never lock again
  const [completed, setCompleted] = useState(false);

  // Track the timestamp of the last time we revealed a category (debounce)
  const lastRevealRef = useRef<number>(0);

  /****************************************************
   * 1) Wheel Handler
   ****************************************************/
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // If we've completed all categories, do nothing => no more locking
      if (completed) {
        return;
      }

      // If we have no data or container, do nothing
      if (!allNetworkData || !chartContainerRef.current) return;

      const { categories } = allNetworkData;
      const totalCategories = categories.length;

      // Get chart center vs viewport center
      const rect = chartContainerRef.current.getBoundingClientRect();
      const chartCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const distance = Math.abs(chartCenter - viewportCenter);

      // If not locked yet, check if the chart center is near the viewport center
      if (!scrollLocked) {
        if (distance < CENTER_TOLERANCE) {
          // Lock scrolling
          setScrollLocked(true);
          document.body.style.overflow = "hidden";
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }

      // If locked, prevent default scrolling
      if (scrollLocked) {
        e.preventDefault();
        e.stopPropagation();

        // If we've already revealed everything, mark completed, unlock, and stop
        if (revealedCategories >= totalCategories) {
          setCompleted(true);
          setScrollLocked(false);
          document.body.style.overflow = "auto";
          return;
        }

        // Otherwise, check the debounce timer
        const now = Date.now();
        if (now - lastRevealRef.current >= DEBOUNCE_INTERVAL) {
          lastRevealRef.current = now;
          // Reveal exactly ONE more category
          setRevealedCategories((prev) => prev + 1);
        }
      }
    },
    [scrollLocked, revealedCategories, allNetworkData, completed]
  );

  /****************************************************
   * 2) Attach "wheel" listener
   ****************************************************/
  useLayoutEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  /****************************************************
   * 3) Fetch Data
   ****************************************************/
  const prepareData = useCallback(async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    try {
      const response = await fetch(`${baseUrl}/data/network_data.json.gz`);
      const buffer = await response.arrayBuffer();
      const decompressed = pako.inflate(new Uint8Array(buffer), {
        to: "string",
      });
      const networkData: NetworkData = JSON.parse(decompressed);
      setAllNetworkData(networkData);
    } catch (error) {
      console.error("Error fetching network data:", error);
    }
  }, []);

  useEffect(() => {
    prepareData();
  }, [prepareData]);

  /****************************************************
   * 4) Create images with circular border
   ****************************************************/
  const createImageWithCircleBorder = useCallback(
    (size: number, borderColor: string, imageName: string) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        const image = new Image();
        image.onload = () => {
          // Set canvas size to be large enough for circle + border
          canvas.width = size + 10;
          canvas.height = size + 10;

          // Border
          ctx.beginPath();
          ctx.arc(
            canvas.width / 2,
            canvas.height / 2,
            size / 2 + 2,
            0,
            Math.PI * 2
          );
          ctx.lineWidth = 2;
          ctx.strokeStyle = borderColor;
          ctx.stroke();
          ctx.closePath();

          // Clip
          ctx.beginPath();
          ctx.arc(
            canvas.width / 2,
            canvas.height / 2,
            size / 2,
            0,
            Math.PI * 2
          );
          ctx.clip();

          // Draw the image
          ctx.drawImage(
            image,
            canvas.width / 2 - size / 2,
            canvas.height / 2 - size / 2,
            size,
            size
          );

          const dataUrl = canvas.toDataURL("image/png");
          const customImage = new Image();
          customImage.src = dataUrl;
          customImage.onload = () => resolve(customImage);
        };
        image.onerror = reject;

        image.src = "images/" + imageName + "_cover.webp";
      });
    },
    []
  );

  /****************************************************
   * 5) Build Option for Partial Reveal
   ****************************************************/
  const getPartialOption = useCallback(
    async (networkData: NetworkData, categoriesCount: number) => {
      const total = networkData.categories.length;
      const usedCount = Math.min(categoriesCount, total);

      // Only use the first `usedCount` categories
      const usedCategories = networkData.categories.slice(0, usedCount);

      // Filter nodes
      const filteredNodes = networkData.nodes.filter(
        (node) => node.category < usedCount
      );

      // Create custom images for the filtered nodes
      const customImages = await Promise.all(
        filteredNodes.map(async (node) => {
          const colorIndex = node.category % predefinedColors.length;
          const categoryColor = predefinedColors[colorIndex];
          const size = node.size / 10 + 10;
          const dataUrl = await createImageWithCircleBorder(
            size,
            categoryColor,
            node.real_id
          );
          return "image://" + dataUrl.src;
        })
      );

      // Filter edges
      const validNodeIds = new Set(filteredNodes.map((n) => n.id));
      const filteredEdges = networkData.edges.filter(
        (edge) => validNodeIds.has(edge.source) && validNodeIds.has(edge.target)
      );

      // Build chart option
      const newOption: echarts.EChartsOption = {
        title: {
          text: "Game communities",
        },
        animationDurationUpdate: 1500,
        animationEasingUpdate: "quinticInOut",
        tooltip: {},
        legend: [
          {
            data: usedCategories.map((cat) => {
              const colorIndex = cat.id % predefinedColors.length;
              return {
                name: cat.name,
                itemStyle: {
                  color: predefinedColors[colorIndex],
                },
              };
            }),
          },
        ],
        series: [
          {
            type: "graph",
            layout: "circular",
            circular: { rotateLabel: true },
            top: "20%",
            bottom: "20%",
            left: "20%",
            right: "20%",
            categories: usedCategories,
            data: filteredNodes.map((node, index) => ({
              real_id: node.real_id,
              id: node.id,
              name: node.id,
              symbol: customImages[index],
              symbolSize: node.size / 10,
              x: node.x,
              y: node.y,
              category: node.category,
              label: {
                show: node.size > 200,
                formatter: (params: any) => params.data.id,
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: 14,
                  fontWeight: "bold",
                  formatter: (params: any) => params.data.id,
                },
                scale: 1.1,
              },
            })),
            edges: filteredEdges.map((edge) => ({
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
                  width: Math.max(10, edge.scaled_edge_weight / 10),
                  opacity: 1,
                },
              },
            })),
            emphasis: {
              focus: "adjacency",
              label: {
                show: true,
                fontWeight: "bold",
              },
            },
            tooltip: {
              formatter: (params: any) => {
                // Node
                if ("name" in params.data) {
                  const imageUrl =
                    "images/" + params.data.real_id + "_cover.webp";
                  return `<div style="text-align: center;">
                            <img src="${imageUrl}"
                                 style="width: 360px; height: 256px;" />
                            <br><b>${params.data.name}</b>
                          </div>`;
                } else {
                  // Edge
                  return (
                    "Common runners between\n" +
                    "<b>" +
                    params.data.source +
                    "</b>" +
                    " and " +
                    "<b>" +
                    params.data.target +
                    "</b>" +
                    ": " +
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

      setOption(newOption);
    },
    [createImageWithCircleBorder]
  );

  /****************************************************
   * 6) Watch revealedCategories
   *    -> Build or update the partial chart
   *    -> If final category is revealed, mark completed
   ****************************************************/
  useEffect(() => {
    if (!allNetworkData) return;
    const total = allNetworkData.categories.length;

    // Rebuild with the latest number of revealed categories
    getPartialOption(allNetworkData, revealedCategories);

    // If everything is revealed => mark completed + unlock (once)
    if (revealedCategories >= total) {
      setCompleted(true);
      setScrollLocked(false);
      document.body.style.overflow = "auto";
    }
  }, [revealedCategories, allNetworkData, getPartialOption]);

  return (
    <div
      ref={chartContainerRef}
      style={{
        width: "min(100vh, 1000px)",
        maxWidth: "100%",
        aspectRatio: "1.2 / 1",
        margin: "0 auto",
        border: "1px solid #444",
      }}
    >
      <ReactECharts
        ref={chartRef}
        option={option || {}}
        style={{
          width: "100%",
          height: "100%",
        }}
        opts={{ renderer: "canvas" }}
        theme="dark"
      />
    </div>
  );
};

export default Page;
