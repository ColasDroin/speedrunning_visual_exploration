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

const categoryDescriptions = [
  {
    id: 0,
    title: "Indie and Challenging",
    text: "Tough indie titles that push your skills to the limit.",
  },
  {
    id: 1,
    title: "Casual and Mobile",
    text: "Quick, accessible games perfect for on-the-go or laid-back runs.",
  },
  {
    id: 2,
    title: "Classic and Retro",
    text: "Timeless hits from older consoles that still captivate speedrunners.",
  },
  {
    id: 3,
    title: "3D Platformers and Open World",
    text: "Sprawling adventures demanding dexterity and route planning.",
  },
  {
    id: 4,
    title: "Action",
    text: "Fast-paced titles emphasizing combat and split-second reflexes.",
  },
  {
    id: 5,
    title: "Minecraft Versions",
    text: "Different Minecraft editions, each with unique quirks and speedrun tactics.",
  },
  {
    id: 6,
    title: "Racing and Sports",
    text: "High-speed competitive games driven by precision and practice.",
  },
  {
    id: 7,
    title: "Classic 3D Platformers",
    text: "Beloved 3D icons requiring tight movement and nostalgic prowess.",
  },
];

const CENTER_TOLERANCE = 50;
const DEBOUNCE_INTERVAL = 1500;
const STARTING_CATEGORIES = 1;

const predefinedColors = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33A6",
  "#FFFF33",
  "#33FFF7",
  "#FF9333",
  "#9B33FF",
  "#FF5733",
  "#7FFF33",
];

const Page: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const [allNetworkData, setAllNetworkData] = useState<NetworkData | null>(
    null
  );
  const [option, setOption] = useState<echarts.EChartsOption | null>(null);

  const [revealedCategories, setRevealedCategories] =
    useState(STARTING_CATEGORIES);
  const [scrollLocked, setScrollLocked] = useState(false);
  const [completed, setCompleted] = useState(false);

  // NEW: Track which category is currently expanded
  const [expandedIndex, setExpandedIndex] = useState<number>(-1);

  const lastRevealRef = useRef<number>(0);

  /****************************************************
   * Wheel handler
   ****************************************************/
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (completed) return;
      if (!allNetworkData || !chartContainerRef.current) return;

      const { categories } = allNetworkData;
      const totalCategories = categories.length;

      const rect = chartContainerRef.current.getBoundingClientRect();
      const chartCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const distance = Math.abs(chartCenter - viewportCenter);

      if (!scrollLocked) {
        if (distance < CENTER_TOLERANCE) {
          setScrollLocked(true);
          document.body.style.overflow = "hidden";
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }

      if (scrollLocked) {
        e.preventDefault();
        e.stopPropagation();

        if (revealedCategories >= totalCategories) {
          setCompleted(true);
          setScrollLocked(false);
          document.body.style.overflow = "auto";
          return;
        }

        const now = Date.now();
        if (now - lastRevealRef.current >= DEBOUNCE_INTERVAL) {
          lastRevealRef.current = now;
          // Reveal one more category
          setRevealedCategories((prev) => {
            const newVal = prev + 1;
            // Expand the newly revealed category
            setExpandedIndex(newVal - 1);
            return newVal;
          });
        }
      }
    },
    [scrollLocked, revealedCategories, allNetworkData, completed]
  );

  /****************************************************
   * Attach "wheel" listener
   ****************************************************/
  useLayoutEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  /****************************************************
   * Fetch Data
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
   * Create images with circular border
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
   * Build Option for Partial Reveal
   ****************************************************/
  const getPartialOption = useCallback(
    async (networkData: NetworkData, categoriesCount: number) => {
      const total = networkData.categories.length;
      const usedCount = Math.min(categoriesCount, total);

      // Only first `usedCount` categories
      const usedCategories = networkData.categories.slice(0, usedCount);

      // Filter nodes
      const filteredNodes = networkData.nodes.filter(
        (node) => node.category < usedCount
      );

      // Create custom images
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
   * Watch revealedCategories
   ****************************************************/
  useEffect(() => {
    if (!allNetworkData) return;
    const total = allNetworkData.categories.length;

    // Rebuild with the new revealedCategories
    getPartialOption(allNetworkData, revealedCategories);

    // If everything is revealed => unlock
    if (revealedCategories >= total) {
      setCompleted(true);
      setScrollLocked(false);
      document.body.style.overflow = "auto";
    }
  }, [revealedCategories, allNetworkData, getPartialOption]);

  /****************************************************
   * RENDER
   ****************************************************/
  return (
    <div style={{ display: "flex", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Side panel */}
      <div
        style={{
          flex: "1",
          padding: "1rem",
          borderRight: "1px solid #444",
        }}
      >
        <h3>Categories Overview</h3>

        {categoryDescriptions.slice(0, revealedCategories).map((desc, idx) => {
          const isExpanded = idx === expandedIndex;
          return (
            <div key={desc.id} style={{ marginBottom: "1rem" }}>
              {/* Title + Tooltip (when collapsed) */}
              <div className="category-tooltip" style={{ fontWeight: "bold" }}>
                {desc.title}
                {/* Only show the tooltip if this category is NOT expanded */}
                {!isExpanded && <div className="tooltip-text">{desc.text}</div>}
              </div>

              {/* Expandable text container */}
              <div
                className={`category-container ${isExpanded ? "expanded" : ""}`}
                style={
                  {
                    // Extra inline style if needed
                  }
                }
              >
                {/* Show text only if expanded */}
                {isExpanded && <p style={{ margin: 0 }}>{desc.text}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart container */}
      <div
        ref={chartContainerRef}
        style={{
          flex: "2",
          aspectRatio: "1.2 / 1",
          border: "1px solid #444",
          marginLeft: "1rem",
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
    </div>
  );
};

export default Page;
