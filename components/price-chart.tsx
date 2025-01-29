"use client";

import ReactECharts from "echarts-for-react";

interface PriceChartProps {
  data: Array<[string, number]>;
  symbol: string;
}

export function PriceChart({ data, symbol }: PriceChartProps) {
  const option = {
    grid: {
      left: 40,
      right: 20,
      top: 20,
      bottom: 20,
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      textStyle: {
        color: "#fff",
      },
    },
    xAxis: {
      type: "time",
      axisLine: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      axisLabel: {
        color: "rgba(255, 255, 255, 0.5)",
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: "value",
      axisLine: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      axisLabel: {
        color: "rgba(255, 255, 255, 0.5)",
        formatter: (value: number) => `$${value.toLocaleString()}`,
      },
      splitLine: {
        lineStyle: {
          color: "rgba(255, 255, 255, 0.05)",
        },
      },
    },
    series: [
      {
        data: data,
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "#f97316",
              },
              {
                offset: 1,
                color: "#ec4899",
              },
            ],
          },
          width: 2,
        },
        areaStyle: {
          opacity: 0.1,
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "#f97316",
              },
              {
                offset: 1,
                color: "#ec4899",
              },
            ],
          },
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "300px", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
