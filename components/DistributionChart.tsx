import React, { useEffect, useRef } from 'react';
import { getChartOptions } from '@/lib/DistributionChartUtils'; // Import the chart options function
import * as echarts from 'echarts';
import { cn } from '@/lib/utils';
import { ArrowRight, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

/**
 * DistributionChart component displays a pie chart representing token distribution.
 * @param {Object} props - Component props.
 * @param {Array} props.tokens - Array of token objects containing balance and symbol.
 * @returns {JSX.Element} The rendered DistributionChart component.
 */






function DistributionChart({ tokens }) {


  function TokenDistributionChart() {
    console.log(tokens, 'from chartß')
    const chartRef = useRef<HTMLDivElement>(null)
  
    useEffect(() => {
      if (chartRef.current) {
        const chart = echarts.init(chartRef.current)
  
        const option = {
          tooltip: {
            trigger: "item",
            formatter: "{b}: {c}%",
          },
          series: [
            {
              name: "Token Distribution",
              type: "pie",
              radius: ["40%", "70%"],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: "#111",
                borderWidth: 2,
              },
              label: {
                show: false,
                position: "center",
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: "12",
                  fontWeight: "bold",
                },
              },
              labelLine: {
                show: false,
              },
              data: tokens,
            },
          ],
          color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
        }
  
        chart.setOption(option)
  
        const resizeObserver = new ResizeObserver(() => chart.resize())
        resizeObserver.observe(chartRef.current)
  
        return () => {
          chart.dispose()
          resizeObserver.disconnect()
        }
      }
    }, [tokens])
  
    return <div ref={chartRef} className="w-full h-32" />
  }

  
  // const chartContainerRef = useRef(null);

    /**
   * Initializes the ECharts instance and sets up the chart options.
   * Updates the chart when the tokens data changes and handles window resizing.
   */
  // useEffect(() => {
  //   if (!chartRef.current) return;
  //   const chart = echarts.init(chartRef.current);
  //   const option = getChartOptions(tokens);
  //   chart.setOption(option);
  //   const handleResize = () => {
  //     chart.resize();
  //   };
  //   window.addEventListener('resize', handleResize);
  //   return () => {
  //     window.removeEventListener('resize', handleResize);
  //     chart.dispose();
  //   };
  // }, [tokens]);

  return (
    <>
{/*     
      <div className="flex justify-center items-center bg-zinc-900/70 font-bold text-2xl hover:border-zinc-700 mb-4 text-white rounded-xl p-2">
        Tokens Distribution
      </div>
      <div
        ref={chartContainerRef}
        className="bg-zink-800 p-6 rounded-lg border dark:border-zinc-800 text-zinc-100"
        style={{ height: '80%', width: '100%' }}
      /> */}


<motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="bg-[#111111]/90 border-gray-800/50 backdrop-blur-xl relative overflow-hidden border rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-lg" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-200">Tokens Distribution</CardTitle>
            <PieChart className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent className="relative">
            <TokenDistributionChart />
            <div className="text-center mt-2">
              <div className="text-lg font-bold text-gray-100">12 Tokens</div>
              <p className="text-xs text-gray-400">Across 5 chains</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>


    </>
  );
}

export default DistributionChart;