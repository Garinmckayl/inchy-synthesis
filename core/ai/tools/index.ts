import { webSearchTool } from './webSearch';
import { walletAnalysisTool } from './walletAnalysis'; // Corrected import name
import { stockChartTool, cryptoChartTool } from './codeInterpreter';

export const tools = {
  web_search: webSearchTool,
  wallet_analysis: walletAnalysisTool, // Use the adapted tool
  // crypto_chart: cryptoChartTool,
  // stock_chart: stockChartTool,
};

export type AppTools = typeof tools;