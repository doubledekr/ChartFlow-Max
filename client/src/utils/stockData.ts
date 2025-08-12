import { ChartData } from '../types/chart';

export async function generateSampleData(symbol: string, period: string): Promise<ChartData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const now = new Date();
  const dataPoints: Array<{ date: string; price: number }> = [];
  
  let days: number;
  switch (period) {
    case '1M': days = 30; break;
    case '3M': days = 90; break;
    case '6M': days = 180; break;
    case '1Y': 
    default: days = 365; break;
  }

  // Generate realistic stock data with some volatility
  let basePrice = getBasePriceForSymbol(symbol);
  const volatility = 0.02; // 2% daily volatility
  const trend = getTrendForSymbol(symbol); // Overall trend factor

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Add random walk with trend
    const dailyChange = (Math.random() - 0.5) * 2 * volatility + trend / 365;
    basePrice *= (1 + dailyChange);
    
    // Ensure price doesn't go too low
    basePrice = Math.max(basePrice, 10);
    
    dataPoints.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(basePrice * 100) / 100,
    });
  }

  return {
    symbol,
    data: dataPoints,
    period,
  };
}

function getBasePriceForSymbol(symbol: string): number {
  const prices: Record<string, number> = {
    'AAPL': 150,
    'GOOGL': 2800,
    'MSFT': 380,
    'TSLA': 800,
    'AMZN': 3200,
    'META': 320,
    'NFLX': 450,
    'NVDA': 450,
  };
  
  return prices[symbol] || 100;
}

function getTrendForSymbol(symbol: string): number {
  const trends: Record<string, number> = {
    'AAPL': 0.15,    // 15% annual growth
    'GOOGL': 0.12,   // 12% annual growth
    'MSFT': 0.18,    // 18% annual growth
    'TSLA': 0.25,    // 25% annual growth (volatile)
    'AMZN': 0.10,    // 10% annual growth
    'META': 0.08,    // 8% annual growth
    'NFLX': 0.05,    // 5% annual growth
    'NVDA': 0.30,    // 30% annual growth
  };
  
  return trends[symbol] || 0.10;
}
