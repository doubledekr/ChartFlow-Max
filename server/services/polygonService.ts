import { storage } from "../storage";

export interface PolygonBar {
  t: number; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

export interface PolygonResponse {
  ticker: string;
  results: PolygonBar[];
  status: string;
  request_id: string;
  count: number;
}

export interface ChartDataPoint {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class PolygonService {
  private apiKey: string | undefined;
  private baseUrl = 'https://api.polygon.io';

  constructor() {
    this.apiKey = process.env.POLYGON_API_KEY;
  }

  private getCacheKey(symbol: string, timeframe: string, multiplier: number): string {
    return `${symbol.toLowerCase()}_${timeframe}_${multiplier}`;
  }

  private getCacheExpiry(timeframe: string): Date {
    const now = new Date();
    // Cache for different durations based on timeframe
    switch (timeframe) {
      case '1D':
        return new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
      case '1W':
        return new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
      case '1M':
      case '3M':
        return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
      case '6M':
      case '1Y':
        return new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
      case '2Y':
      case '5Y':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      default:
        return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour default
    }
  }

  private getDateRange(timeframe: string): { from: string; to: string } {
    const now = new Date();
    const to = now.toISOString().split('T')[0]; // YYYY-MM-DD
    let from: Date;

    switch (timeframe) {
      case '1D':
        from = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
        break;
      case '1W':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1M':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3M':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6M':
        from = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1Y':
        from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '2Y':
        from = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        break;
      case '5Y':
        from = new Date(now.getTime() - 1825 * 24 * 60 * 60 * 1000);
        break;
      default:
        from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    return {
      from: from.toISOString().split('T')[0],
      to
    };
  }

  private getMultiplierAndTimespan(timeframe: string): { multiplier: number; timespan: string } {
    switch (timeframe) {
      case '1D':
        return { multiplier: 5, timespan: 'minute' };
      case '1W':
        return { multiplier: 15, timespan: 'minute' };
      case '1M':
        return { multiplier: 1, timespan: 'hour' };
      case '3M':
      case '6M':
        return { multiplier: 1, timespan: 'day' };
      case '1Y':
      case '2Y':
      case '5Y':
        return { multiplier: 1, timespan: 'day' };
      default:
        return { multiplier: 1, timespan: 'day' };
    }
  }

  private formatChartData(polygonData: PolygonBar[]): ChartDataPoint[] {
    return polygonData.map(bar => ({
      timestamp: bar.t,
      date: new Date(bar.t).toISOString(),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v
    }));
  }

  async getStockData(symbol: string, timeframe: string): Promise<ChartDataPoint[]> {
    const { multiplier, timespan } = this.getMultiplierAndTimespan(timeframe);
    const cacheKey = this.getCacheKey(symbol, timeframe, multiplier);

    // Try cache first
    const cached = await storage.getCachedData(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${symbol} ${timeframe}`);
      return cached.data as ChartDataPoint[];
    }

    // If no API key, return demo data
    if (!this.apiKey) {
      console.log(`No Polygon API key found, generating demo data for ${symbol} ${timeframe}`);
      const demoData = this.generateDemoData(symbol, timeframe);
      
      // Cache demo data
      await storage.setCachedData({
        cacheKey,
        data: demoData,
        expiresAt: this.getCacheExpiry(timeframe),
      });
      
      return demoData;
    }

    try {
      const { from, to } = this.getDateRange(timeframe);
      const url = `${this.baseUrl}/v2/aggs/ticker/${symbol.toUpperCase()}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=50000&apikey=${this.apiKey}`;

      console.log(`Fetching data from Polygon API: ${symbol} ${timeframe}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
      }

      const data: PolygonResponse = await response.json();
      
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        console.log(`No data from Polygon API for ${symbol}, using demo data`);
        const demoData = this.generateDemoData(symbol, timeframe);
        
        await storage.setCachedData({
          cacheKey,
          data: demoData,
          expiresAt: this.getCacheExpiry(timeframe),
        });
        
        return demoData;
      }

      const chartData = this.formatChartData(data.results);

      // Cache the result
      await storage.setCachedData({
        cacheKey,
        data: chartData,
        expiresAt: this.getCacheExpiry(timeframe),
      });

      return chartData;

    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      
      // Fallback to demo data
      console.log(`Falling back to demo data for ${symbol} ${timeframe}`);
      const demoData = this.generateDemoData(symbol, timeframe);
      
      await storage.setCachedData({
        cacheKey,
        data: demoData,
        expiresAt: this.getCacheExpiry(timeframe),
      });
      
      return demoData;
    }
  }

  private generateDemoData(symbol: string, timeframe: string): ChartDataPoint[] {
    const { multiplier, timespan } = this.getMultiplierAndTimespan(timeframe);
    const { from } = this.getDateRange(timeframe);
    
    const startDate = new Date(from);
    const endDate = new Date();
    const points: ChartDataPoint[] = [];
    
    // Generate realistic number of data points
    let intervalMs: number;
    let totalPoints: number;
    
    switch (timespan) {
      case 'minute':
        intervalMs = multiplier * 60 * 1000;
        totalPoints = Math.min(1000, Math.floor((endDate.getTime() - startDate.getTime()) / intervalMs));
        break;
      case 'hour':
        intervalMs = multiplier * 60 * 60 * 1000;
        totalPoints = Math.min(500, Math.floor((endDate.getTime() - startDate.getTime()) / intervalMs));
        break;
      case 'day':
        intervalMs = multiplier * 24 * 60 * 60 * 1000;
        totalPoints = Math.min(365, Math.floor((endDate.getTime() - startDate.getTime()) / intervalMs));
        break;
      default:
        intervalMs = 24 * 60 * 60 * 1000;
        totalPoints = 100;
    }

    // Base price varies by symbol
    const symbolHash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    let basePrice = 50 + (symbolHash % 500); // Price between 50-550
    
    for (let i = 0; i < totalPoints; i++) {
      const timestamp = startDate.getTime() + (i * intervalMs);
      const date = new Date(timestamp);
      
      // Skip weekends for daily data
      if (timespan === 'day' && (date.getDay() === 0 || date.getDay() === 6)) {
        continue;
      }

      // Generate realistic price movement
      const volatility = 0.02; // 2% volatility
      const trend = Math.sin(i / totalPoints * Math.PI) * 0.001; // Slight overall trend
      const randomChange = (Math.random() - 0.5) * volatility;
      
      basePrice = basePrice * (1 + trend + randomChange);
      
      const open = basePrice;
      const volatilityRange = basePrice * 0.01; // 1% intraday range
      const high = open + Math.random() * volatilityRange;
      const low = open - Math.random() * volatilityRange;
      const close = low + Math.random() * (high - low);
      
      const volume = Math.floor(1000000 + Math.random() * 5000000);

      points.push({
        timestamp,
        date: date.toISOString(),
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume
      });

      basePrice = close; // Use close as next open
    }

    return points.slice(-Math.min(points.length, 1000)); // Limit to 1000 points max
  }

  async clearExpiredCache(): Promise<void> {
    await storage.clearExpiredCache();
  }
}

export const polygonService = new PolygonService();