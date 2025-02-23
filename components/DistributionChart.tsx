import React, { useEffect, useRef } from 'react';
import { getChartOptions } from '@/lib/DistributionChartUtils'; // Import the chart options function
import * as echarts from 'echarts';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

/**
 * DistributionChart component displays a pie chart representing token distribution.
 * @param {Object} props - Component props.
 * @param {Array} props.tokens - Array of token objects containing balance and symbol.
 * @returns {JSX.Element} The rendered DistributionChart component.
 */
function DistributionChart({ tokens }) {
  const chartContainerRef = useRef(null);

    /**
   * Initializes the ECharts instance and sets up the chart options.
   * Updates the chart when the tokens data changes and handles window resizing.
   */
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = echarts.init(chartContainerRef.current);
    const option = getChartOptions(tokens);
    chart.setOption(option);
    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [tokens]);

  return (
    <>
    
      <div className="flex justify-center items-center bg-zinc-900/70 font-bold text-2xl hover:border-zinc-700 mb-4 text-white rounded-xl p-2">
        Tokens Distribution
      </div>
      <div
        ref={chartContainerRef}
        className="bg-zink-800 p-6 rounded-lg border dark:border-zinc-800 text-zinc-100"
        style={{ height: '80%', width: '100%' }}
      />




{/* <div
            className={cn(
              "flex flex-col",
              "w-[280px] shrink-0",
              "bg-white dark:bg-zinc-900/70",
              "rounded-xl",
              "border border-zinc-100 dark:border-zinc-800",
              "hover:border-zinc-200 dark:hover:border-zinc-700",
              "transition-all duration-200",
              "shadow-sm backdrop-blur-xl",
            )}
          >
            <div className="p-4 space-y-3">
            <span className="text-xl font-medium text-zinc-100">
            Tokens Distribution
            </span>
              <div className="flex items-start justify-between">

              <div
        ref={chartContainerRef}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg"
        style={{ height: '80%', width: '100%' }}
      />

              </div>


            </div>

            <div className="mt-auto border-t border-zinc-100 dark:border-zinc-800">
              <button
                className={cn(
                  "w-full flex items-center justify-center gap-2",
                  "py-2.5 px-3",
                  "text-xs font-medium",
                  "text-zinc-600 dark:text-zinc-400",
                  "hover:text-zinc-900 dark:hover:text-zinc-100",
                  "hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
                  "transition-colors duration-200",
                )}
              >
                View Details
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div> */}

    </>
  );
}

export default DistributionChart;