"use client";
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useLayoutEffect,
  MouseEvent,
} from "react";
import ReactECharts from "echarts-for-react";
import pako from "pako";
import Portal from "./Portal";

interface RawNode {
  real_id: string;
  id: string;
  players: number;
  x: number;
  y: number;
  size: number;
  community: number;
  category: number;
}

interface RawEdge {
  source: string;
  target: string;
  weight: number;
  scaled_edge_weight: number;
}

interface Category {
  id: number;
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
    text: "Games like 'Celeste', 'Hollow Knight', and 'Portal' that demand precision and skill.",
  },
  {
    id: 1,
    title: "Casual and Mobile",
    text: "Accessible games including 'Subway Surfers' and 'Hill Climb Racing' for quick fun.",
  },
  {
    id: 2,
    title: "Classic and Retro",
    text: "Beloved classics like 'Super Mario 64' and 'The Legend of Zelda: Ocarina of Time'.",
  },
  {
    id: 3,
    title: "2D Platformers",
    text: "Timeless 2D games such as 'Super Mario Bros.' and 'Super Metroid'.",
  },
  {
    id: 4,
    title: "3D Adventures",
    text: "Sprawling 3D adventures like 'The Legend of Zelda: Breath of the Wild' and 'Mario Kart Wii'.",
  },
  {
    id: 5,
    title: "Minecraft Versions",
    text: "Different 'Minecraft' editions, including 'Java' and 'Bedrock', for varied speedrun tactics.",
  },
];

const CENTER_TOLERANCE = 50;
const DEBOUNCE_INTERVAL = 1000;
const STARTING_CATEGORIES = 1;
const FINAL_GRACE_PERIOD = 1000; // ms (1 second) for the last fold

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

const Fig2WithPortal: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  let isSmallScreen = false;
  if (typeof window !== "undefined") {
    isSmallScreen = window.innerWidth < 768;
  } else {
    console.error("Window object is not available.");
  }
  const fontSize = isSmallScreen ? 12 : 18;

  const [allNetworkData, setAllNetworkData] = useState<NetworkData | null>(
    null
  );
  const [option, setOption] = useState<echarts.EChartsOption | null>(null);

  // Reveal state
  const [revealedCategories, setRevealedCategories] =
    useState(STARTING_CATEGORIES);
  const [scrollLocked, setScrollLocked] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Which category is currently expanded
  const [expandedIndex, setExpandedIndex] = useState<number>(-1);

  // Fade-in for each category on appear
  const [appeared, setAppeared] = useState<boolean[]>([]);

  // Track if we've folded the last category
  const [hasFoldedLast, setHasFoldedLast] = useState(false);

  // If we revealed final category, store time
  const [timeLastCategoryReveal, setTimeLastCategoryReveal] = useState<
    number | null
  >(null);

  // For Portal tooltip:
  const [hoveringIndex, setHoveringIndex] = useState<number | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const lastRevealRef = useRef<number>(0);

  // For mobile touch
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  /****************************************************
   * Shared reveal logic
   ****************************************************/
  const triggerReveal = useCallback(() => {
    if (!allNetworkData) return;
    const totalCategories = allNetworkData.categories.length;

    // If we've revealed all categories
    if (revealedCategories >= totalCategories) {
      if (!hasFoldedLast) {
        const now = Date.now();

        // Record reveal time if missing
        if (!timeLastCategoryReveal) {
          setTimeLastCategoryReveal(now);
          return;
        }

        // Wait for grace period
        if (now - timeLastCategoryReveal < FINAL_GRACE_PERIOD) {
          return;
        }

        // fold last category
        setHasFoldedLast(true);
        setExpandedIndex(-1);
        return;
      } else {
        // finalize
        setCompleted(true);
        setScrollLocked(false);
        document.body.style.overflow = "auto";
        return;
      }
    }

    // Otherwise normal reveal
    const now = Date.now();
    if (now - lastRevealRef.current >= DEBOUNCE_INTERVAL) {
      lastRevealRef.current = now;
      setRevealedCategories((prev) => {
        const newVal = prev + 1;
        setExpandedIndex(newVal - 1);
        return newVal;
      });
    }
  }, [
    revealedCategories,
    hasFoldedLast,
    timeLastCategoryReveal,
    allNetworkData,
  ]);

  /****************************************************
   * Wheel Handler (desktop) — only reveal on upward scroll
   ****************************************************/
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!allNetworkData || !chartContainerRef.current) return;
      if (completed) return; // done

      // Only trigger if the user is scrolling "up" => e.deltaY > 0
      if (e.deltaY <= 0) {
        // This means user scrolled down or no movement => do nothing
        return;
      }

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
        triggerReveal();
      }
    },
    [allNetworkData, chartContainerRef, completed, triggerReveal, scrollLocked]
  );

  /****************************************************
   * Touch Handlers (mobile) — only reveal on upward swipe
   ****************************************************/
  const handleTouchStart = useCallback((e: TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!allNetworkData || !chartContainerRef.current) return;
      if (completed) return;
      if (touchStartY === null) return;

      // Calculate the swipe distance
      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY;

      // Only proceed if user swipes upward => deltaY > 0
      if (deltaY <= 0) {
        return;
      }

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
        triggerReveal();
      }
    },
    [
      allNetworkData,
      chartContainerRef,
      completed,
      scrollLocked,
      triggerReveal,
      touchStartY,
    ]
  );

  /****************************************************
   * Attach/detach wheel & touch listeners
   ****************************************************/
  useLayoutEffect(() => {
    // Desktop
    window.addEventListener("wheel", handleWheel, { passive: false });
    // Mobile
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove]);

  /****************************************************
   * Fetch data
   ****************************************************/
  const prepareData = useCallback(async () => {
    const baseUrl = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}`;
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
   * createImageWithCircleBorder
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
          // Set canvas size depending on screen size and image size

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
   * Build ECharts option for partial reveal
   ****************************************************/
  const getPartialOption = useCallback(
    async (networkData: NetworkData, categoriesCount: number) => {
      const total = networkData.categories.length;
      const usedCount = Math.min(categoriesCount, total);

      // Only the first usedCount categories
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
          left: "center",
          textStyle: { color: "white", fontSize: fontSize },
        },
        backgroundColor: "transparent",
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
            bottom: 0, // the size of title + margin
            left: "left", // or 0 or '0%'
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
              symbolSize: isSmallScreen ? node.size / 40 : node.size / 10,
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
   * Watch revealedCategories => update chart & side panel
   ****************************************************/
  useEffect(() => {
    if (!allNetworkData) return;
    const total = allNetworkData.categories.length;

    // Update the chart to show up to `revealedCategories`
    getPartialOption(allNetworkData, revealedCategories);

    // Mark revealed categories as appeared (fade-in)
    setAppeared((prev) => {
      const newState = [...prev];
      for (let i = 0; i < revealedCategories; i++) {
        newState[i] = true;
      }
      return newState;
    });

    // Logic for expanding/folding categories
    if (revealedCategories === 1) {
      // Keep the first category expanded
      setExpandedIndex(0);
    } else if (revealedCategories === 2) {
      // Fold the first category and expand the second
      setExpandedIndex(1);
    } else if (revealedCategories > 2 && revealedCategories <= total) {
      // Expand the most recently revealed category
      setExpandedIndex(revealedCategories - 1);
    }

    // If we just revealed the final category, record time for folding logic
    if (revealedCategories === total && !timeLastCategoryReveal) {
      setTimeLastCategoryReveal(Date.now());
    }
  }, [
    revealedCategories,
    allNetworkData,
    getPartialOption,
    timeLastCategoryReveal,
  ]);

  /****************************************************
   * Tooltip Mouse Handlers
   ****************************************************/
  const onTitleMouseEnter = (e: MouseEvent<HTMLDivElement>, catId: number) => {
    setHoveringIndex(catId);
    setHoverCoords({ x: e.clientX + 10, y: e.clientY + 10 });
  };

  const onTitleMouseLeave = () => {
    setHoveringIndex(null);
  };

  const onTitleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    setHoverCoords({ x: e.clientX + 10, y: e.clientY + 10 });
  };

  /****************************************************
   * Render
   ****************************************************/
  return (
    <div style={{ display: "flex", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Side panel */}
      <div
        style={{
          flex: "1",
          padding: "0.2rem",
          position: "relative",
          zIndex: 9999,
          overflow: "visible",
        }}
      >
        {categoryDescriptions.slice(0, revealedCategories).map((desc, idx) => {
          const isExpanded = idx === expandedIndex;
          const hasAppeared = appeared[idx] || false;

          return (
            <div
              key={desc.id}
              className={`category-wrapper ${hasAppeared ? "appeared" : ""}`}
              style={{ marginBottom: "1rem" }}
            >
              {/* Title: we track hover events for tooltip */}
              <div
                style={{
                  fontWeight: "bold",
                  display: "inline-block",
                  fontSize: isSmallScreen ? "0.8rem" : "1.2rem",
                }}
                onMouseEnter={(e) => onTitleMouseEnter(e, desc.id)}
                onMouseLeave={onTitleMouseLeave}
                onMouseMove={onTitleMouseMove}
              >
                {desc.title}
              </div>

              {/* Folding container */}
              <div
                className={`category-container ${isExpanded ? "expanded" : ""}`}
                style={{
                  marginTop: "0.5rem",
                  fontSize: isSmallScreen ? "0.7rem" : "1.1rem",
                }}
              >
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
          flex: "3",
          aspectRatio: "1.2 / 1",
          marginLeft: isSmallScreen ? "0.1rem" : "1rem",
        }}
      >
        <ReactECharts
          ref={chartRef}
          option={option || {}}
          style={{
            width: "100%",
            height: isSmallScreen ? "800px" : "450px",
          }}
          opts={{ renderer: "canvas" }}
          theme="dark"
        />
      </div>

      {/* PORTAL-BASED TOOLTIP */}
      <Portal>
        {hoveringIndex !== null && (
          <div
            style={{
              position: "fixed", // or 'absolute' if you prefer
              top: hoverCoords.y,
              left: hoverCoords.x,
              zIndex: 999999, // ensure on top
              backgroundColor: "#000",
              color: "#fff",
              padding: "8px",
              borderRadius: "4px",
              pointerEvents: "none",
              maxWidth: "250px",
            }}
          >
            {/* Show text of whichever category we are hovering */}
            {categoryDescriptions[hoveringIndex]?.text}
          </div>
        )}
      </Portal>
    </div>
  );
};

export default Fig2WithPortal;
