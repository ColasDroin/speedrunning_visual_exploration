"use client";
import React, { useRef, useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import pako from "pako";

const Page: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [option, setOption] = useState<echarts.EChartsOption | null>(null);
  const currentCategoryIndexRef = useRef(0);
  const isAnimating = useRef<boolean>(false);
  const isCentered = useRef<boolean>(false);
  const lastScrollTimeRef = useRef<number>(0);
  const accumulatedDeltaRef = useRef(0);

  const predefinedColors = [
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "#FF33A6",
    "#FFFF33",
    "#33FFF7",
    "#FF9333",
    "#9B33FF",
  ];

  const SCROLL_THRESHOLD = 500;

  const prepareGraph = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    let networkData: any[] = [];

    try {
      const response = await fetch(`${baseUrl}/data/network_data.json.gz`);
      const buffer = await response.arrayBuffer();
      const decompressed = pako.inflate(new Uint8Array(buffer), {
        to: "string",
      });
      networkData = JSON.parse(decompressed);
      console.log("Network data loaded:", networkData);
    } catch (error) {
      console.error("Error fetching scatter data:", error);
      return;
    }

    const createChartOption = (visibleCategories: any[]) => {
      console.log(
        "Creating chart with categories:",
        visibleCategories.map((cat) => cat.name)
      );
      return {
        title: { text: "Game communities" },
        animationDurationUpdate: 1500,
        animationEasingUpdate: "quinticInOut",
        tooltip: {},
        legend: [
          {
            data: visibleCategories.map((a) => ({
              name: a.name,
              itemStyle: {
                color: predefinedColors[a.id % predefinedColors.length],
              },
            })),
          },
        ],
        series: [
          {
            type: "graph",
            layout: "circular",
            circular: { rotateLabel: true },
            data: networkData.nodes
              .filter((node) =>
                visibleCategories.some((cat) => cat.id === node.category)
              )
              .map((node) => ({
                id: node.id,
                name: node.id,
                symbolSize: node.size / 10,
                x: node.x,
                y: node.y,
                category: node.category,
                label: { show: node.size > 200 },
              })),
            edges: networkData.edges.filter((edge) =>
              visibleCategories.some(
                (cat) =>
                  cat.id ===
                  networkData.nodes.find((n) => n.id === edge.source)?.category
              )
            ),
            categories: visibleCategories,
          },
        ],
      };
    };

    setOption(createChartOption([networkData.categories[0]]));
    currentCategoryIndexRef.current = 1;

    const onScroll = (event: WheelEvent) => {
      console.log("TEDTDF");
      console.log("isCentered", isCentered.current);
      console.log("isAnimating", isAnimating.current);
      if (!isCentered.current || isAnimating.current) return;
      console.log("TEDTDdfdfdF");
      // event.preventDefault();
      const now = Date.now();
      const delta = event.deltaY;
      accumulatedDeltaRef.current += delta;

      // if (
      //   now - lastScrollTimeRef.current < 300 ||
      //   Math.abs(accumulatedDeltaRef.current) < SCROLL_THRESHOLD
      // ) {
      //   console.log("Scrolling too fast or not enough.");
      //   return;
      // }

      lastScrollTimeRef.current = now;

      if (currentCategoryIndexRef.current < networkData.categories.length) {
        isAnimating.current = true;
        const nextCategories = networkData.categories.slice(
          0,
          currentCategoryIndexRef.current + 1
        );
        console.log(
          "Adding category:",
          networkData.categories[currentCategoryIndexRef.current]
        );
        setOption(createChartOption(nextCategories));
        currentCategoryIndexRef.current += 1;

        accumulatedDeltaRef.current = 0;

        setTimeout(() => (isAnimating.current = false), 1500);
      } else {
        console.log("All categories loaded. Removing scroll lock.");
        window.removeEventListener("wheel", onScroll);
        document.body.style.overflow = "auto"; // Re-enable scrolling
      }
    };

    console.log("Attaching scroll event listener.");
    window.addEventListener("wheel", onScroll, { passive: false });

    return () => {
      console.log("Cleaning up scroll event listener.");
      window.removeEventListener("wheel", onScroll);
    };
  };

  useEffect(() => {
    prepareGraph();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const isFullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight; // Check if fully visible

      const isCenteredTemp =
        rect.top <= window.innerHeight / 2 &&
        rect.bottom >= window.innerHeight / 2; // Check if centered

      isCentered.current = isFullyVisible && isCenteredTemp;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    console.log("TEST");
    if (isCentered.current && currentCategoryIndexRef.current <= 6) {
      console.log("Scroll lock enabled.");
      document.body.style.overflow = "hidden"; // Lock scrolling
    } else if (!isAnimating.current && currentCategoryIndexRef.current === 6) {
      console.log("All categories loaded. Removing scroll lock.");
      console.log("isCentered", isCentered.current);
      console.log("isAnimating", isAnimating.current);
      console.log("currentCategoryIndexRef", currentCategoryIndexRef.current);
      document.body.style.overflow = "auto"; // Unlock scrolling
    }
  }, [isCentered, isAnimating]);

  return (
    <div style={{ height: "200vh" }}>
      <div ref={containerRef} style={{ marginTop: "50vh" }}>
        <ReactECharts
          ref={chartRef}
          option={option || {}}
          style={{ height: "min(90vh, 1000px)", width: "100%" }}
          opts={{ renderer: "canvas" }}
          theme="dark"
        />
      </div>
    </div>
  );
};

export default Page;
