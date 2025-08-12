export interface ChartDataPoint {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class PolygonClient {
  static async getStockData(symbol: string, timeframe: string): Promise<ChartDataPoint[]> {
    const response = await fetch(`/api/stocks/${symbol}/${timeframe}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stock data: ${response.statusText}`);
    }
    return await response.json();
  }
}

export const polygonClient = new PolygonClient();