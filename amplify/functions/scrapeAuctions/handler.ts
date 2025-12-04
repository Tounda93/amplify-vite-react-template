import type { Handler } from 'aws-lambda';
import https from 'https';
import http from 'http';

// Types for auction data
interface AuctionLot {
  auctionHouse: string;
  lotNumber: string;
  title: string;
  description?: string;
  imageUrl?: string;
  estimateLow?: number;
  estimateHigh?: number;
  currency: string;
  reserveStatus: 'reserve' | 'no_reserve' | 'unknown';
  status: 'upcoming' | 'live' | 'sold' | 'not_sold' | 'withdrawn';
  auctionDate?: string;
  auctionLocation?: string;
  auctionName?: string;
  lotUrl?: string;
}

// Helper to fetch URL content
function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    }, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        if (res.headers.location) {
          fetchUrl(res.headers.location).then(resolve).catch(reject);
          return;
        }
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Scrape RM Sotheby's auctions
async function scrapeRMSothebys(): Promise<AuctionLot[]> {
  const lots: AuctionLot[] = [];
  
  try {
    // RM Sotheby's has an API endpoint for their auctions
    const html = await fetchUrl('https://rmsothebys.com/en/home/auctions/');
    
    // Extract auction links - look for upcoming auctions
    const auctionPattern = /<a[^>]*href="(\/en\/auctions\/[^"]+)"[^>]*>([^<]*)<\/a>/gi;
    const datePattern = /(\d{1,2}\s+\w+\s+\d{4})/;
    const locationPattern = /([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)*)/;
    
    let match;
    const auctionUrls: string[] = [];
    
    while ((match = auctionPattern.exec(html)) !== null) {
      if (!auctionUrls.includes(match[1])) {
        auctionUrls.push(match[1]);
      }
    }
    
    // For each auction, try to get lot details (limit to first 2 auctions to avoid rate limiting)
    for (const auctionPath of auctionUrls.slice(0, 2)) {
      try {
        const auctionUrl = `https://rmsothebys.com${auctionPath}`;
        const auctionHtml = await fetchUrl(auctionUrl);
        
        // Extract auction name and location from page
        const titleMatch = auctionHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        const auctionName = titleMatch ? titleMatch[1].trim() : 'RM Sotheby\'s Auction';
        
        // Look for lot cards
        const lotPattern = /lot-card[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[\s\S]*?class="lot-title"[^>]*>([^<]*)<[\s\S]*?estimate[^>]*>([^<]*)</gi;
        
        let lotMatch;
        let lotNum = 1;
        
        while ((lotMatch = lotPattern.exec(auctionHtml)) !== null && lotNum <= 20) {
          const [_, lotUrl, imageUrl, title, estimate] = lotMatch;
          
          // Parse estimate (e.g., "$500,000 - $600,000")
          const estimateMatch = estimate.match(/[\$€£]?([\d,]+)\s*[-–]\s*[\$€£]?([\d,]+)/);
          let estimateLow, estimateHigh;
          if (estimateMatch) {
            estimateLow = parseInt(estimateMatch[1].replace(/,/g, ''));
            estimateHigh = parseInt(estimateMatch[2].replace(/,/g, ''));
          }
          
          lots.push({
            auctionHouse: "RM Sotheby's",
            lotNumber: String(lotNum++),
            title: title.trim(),
            imageUrl: imageUrl,
            estimateLow,
            estimateHigh,
            currency: 'USD',
            reserveStatus: 'unknown',
            status: 'upcoming',
            auctionName,
            lotUrl: lotUrl.startsWith('http') ? lotUrl : `https://rmsothebys.com${lotUrl}`,
          });
        }
      } catch (err) {
        console.error(`Error fetching auction ${auctionPath}:`, err);
      }
    }
  } catch (error) {
    console.error('Error scraping RM Sothebys:', error);
  }
  
  return lots;
}

// Scrape Bonhams auctions
async function scrapeBonhams(): Promise<AuctionLot[]> {
  const lots: AuctionLot[] = [];
  
  try {
    const html = await fetchUrl('https://www.bonhams.com/departments/MOT-CAR/');
    
    // Look for auction listings
    const auctionPattern = /auction-item[\s\S]*?href="([^"]*)"[\s\S]*?<img[^>]*src="([^"]*)"[\s\S]*?title[^>]*>([^<]*)<[\s\S]*?date[^>]*>([^<]*)</gi;
    
    let match;
    let lotNum = 1;
    
    while ((match = auctionPattern.exec(html)) !== null && lotNum <= 20) {
      const [_, lotUrl, imageUrl, title, dateStr] = match;
      
      lots.push({
        auctionHouse: 'Bonhams',
        lotNumber: String(lotNum++),
        title: title.trim(),
        imageUrl,
        currency: 'GBP',
        reserveStatus: 'unknown',
        status: 'upcoming',
        auctionName: 'Bonhams Motoring',
        lotUrl: lotUrl.startsWith('http') ? lotUrl : `https://www.bonhams.com${lotUrl}`,
      });
    }
  } catch (error) {
    console.error('Error scraping Bonhams:', error);
  }
  
  return lots;
}

// Scrape Broad Arrow auctions  
async function scrapeBroadArrow(): Promise<AuctionLot[]> {
  const lots: AuctionLot[] = [];
  
  try {
    const html = await fetchUrl('https://www.broadarrowauctions.com/auctions');
    
    // Look for vehicle cards
    const vehiclePattern = /vehicle-card[\s\S]*?href="([^"]*)"[\s\S]*?<img[^>]*src="([^"]*)"[\s\S]*?vehicle-title[^>]*>([^<]*)<[\s\S]*?estimate[^>]*>([^<]*)</gi;
    
    let match;
    let lotNum = 1;
    
    while ((match = vehiclePattern.exec(html)) !== null && lotNum <= 20) {
      const [_, lotUrl, imageUrl, title, estimate] = match;
      
      const estimateMatch = estimate.match(/\$([\d,]+)\s*[-–]\s*\$([\d,]+)/);
      let estimateLow, estimateHigh;
      if (estimateMatch) {
        estimateLow = parseInt(estimateMatch[1].replace(/,/g, ''));
        estimateHigh = parseInt(estimateMatch[2].replace(/,/g, ''));
      }
      
      lots.push({
        auctionHouse: 'Broad Arrow',
        lotNumber: String(lotNum++),
        title: title.trim(),
        imageUrl,
        estimateLow,
        estimateHigh,
        currency: 'USD',
        reserveStatus: 'unknown',
        status: 'upcoming',
        auctionName: 'Broad Arrow Auction',
        lotUrl: lotUrl.startsWith('http') ? lotUrl : `https://www.broadarrowauctions.com${lotUrl}`,
      });
    }
  } catch (error) {
    console.error('Error scraping Broad Arrow:', error);
  }
  
  return lots;
}

// Main handler
export const handler: Handler = async (event) => {
  console.log('Starting auction scrape...');
  
  const results = {
    rmSothebys: 0,
    bonhams: 0,
    broadArrow: 0,
    errors: [] as string[],
  };
  
  try {
    // Scrape all auction houses in parallel
    const [rmLots, bonhamsLots, broadArrowLots] = await Promise.all([
      scrapeRMSothebys().catch(err => {
        results.errors.push(`RM Sotheby's: ${err.message}`);
        return [];
      }),
      scrapeBonhams().catch(err => {
        results.errors.push(`Bonhams: ${err.message}`);
        return [];
      }),
      scrapeBroadArrow().catch(err => {
        results.errors.push(`Broad Arrow: ${err.message}`);
        return [];
      }),
    ]);
    
    results.rmSothebys = rmLots.length;
    results.bonhams = bonhamsLots.length;
    results.broadArrow = broadArrowLots.length;
    
    const allLots = [...rmLots, ...bonhamsLots, ...broadArrowLots];
    
    console.log(`Scraped ${allLots.length} total lots`);
    
    // Return the lots - they'll be saved by the calling function
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Scraped ${allLots.length} auction lots`,
        results,
        lots: allLots,
      }),
    };
    
  } catch (error) {
    console.error('Scrape error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to scrape auctions',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};