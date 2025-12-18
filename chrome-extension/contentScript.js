function textFrom(node) {
  if (!node) return '';
  return (node.textContent || '').replace(/\s+/g, ' ').trim();
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return '';
}

function parseEstimateRange(estimateText) {
  const text = (estimateText || '').replace(/\u00a0/g, ' ').trim();
  if (!text) return { estimateLow: undefined, estimateHigh: undefined, currency: undefined };

  const toNumber = (value) => {
    const cleaned = value.replace(/,/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  // Prefer a proper money range match so we don't accidentally parse the lot number.
  const rangeMatch = text.match(
    /([$€£])?\s*([\d,.]+)\s*[-–]\s*(?:[$€£])?\s*([\d,.]+)\s*(USD|EUR|GBP|CHF|CAD|AUD)?/i
  );

  const currencyFromSymbol = (symbol) => {
    if (symbol === '$') return 'USD';
    if (symbol === '€') return 'EUR';
    if (symbol === '£') return 'GBP';
    return undefined;
  };

  if (rangeMatch) {
    const symbol = rangeMatch[1];
    const low = toNumber(rangeMatch[2]);
    const high = toNumber(rangeMatch[3]);
    const code = rangeMatch[4] ? rangeMatch[4].toUpperCase() : undefined;
    return { estimateLow: low, estimateHigh: high, currency: code || currencyFromSymbol(symbol) };
  }

  const currencyMatch = text.match(/\b(USD|EUR|GBP|CHF|CAD|AUD)\b/i);
  const currency = currencyMatch ? currencyMatch[1].toUpperCase() : undefined;

  return { estimateLow: undefined, estimateHigh: undefined, currency };
}

function extractEstimateText(card) {
  const candidates = Array.from(card.querySelectorAll('span.lot-value-status, span.heading-subtitle.lot-value-status'))
    .map((el) => textFrom(el))
    .filter(Boolean);

  for (const candidate of candidates) {
    if ((/\$|€|£/.test(candidate) || /\bUSD\b|\bEUR\b|\bGBP\b|\bCHF\b|\bCAD\b|\bAUD\b/i.test(candidate)) && /[-–]/.test(candidate)) {
      const pipeSplit = candidate.split('|').map((s) => s.trim()).filter(Boolean);
      return pipeSplit.length > 1 ? pipeSplit[pipeSplit.length - 1] : candidate;
    }
  }

  return candidates[0] || '';
}

function extractLotNumber(card) {
  // Prefer the dedicated child span that contains the "Lot X |" prefix.
  const prefixSpanText = textFrom(card.querySelector('span.lot-value-status > span'));
  const prefixMatch = prefixSpanText.match(/\bLot\s+([0-9A-Za-z-]+)\b/i);
  if (prefixMatch) return prefixMatch[1];

  // Fallback: some pages don't include a lot number in the visible text. Derive from lot URL slug (e.g. r0050-...).
  const href = card.querySelector('a[href*="/lots/"]')?.getAttribute('href') || '';
  const slug = href.split('/').filter(Boolean).pop() || '';
  const slugMatch = slug.match(/^[a-z]0*([0-9]{1,})-/i);
  if (slugMatch) return slugMatch[1];

  return '';
}

function extractLotUrl(card) {
  const anchors = Array.from(card.querySelectorAll('a[href]'));
  const lotAnchor = anchors.find((a) => a.getAttribute('href')?.includes('/lots/'));
  if (!lotAnchor) return '';
  const href = lotAnchor.getAttribute('href') || '';
  try {
    return new URL(href, window.location.origin).toString();
  } catch {
    return href;
  }
}

function extractCoverImageUrl(card) {
  const img = card.querySelector('img.expanded-content, img');
  if (!img) return '';

  // RM Sotheby's sometimes lazy-loads via data-src; Angular uses ng-src -> src.
  const url = firstNonEmpty(img.currentSrc, img.src, img.getAttribute('data-src') || '', img.getAttribute('src') || '');
  return url;
}

function extractShortDescription(card) {
  return textFrom(card.querySelector('.collection-tagline'));
}

function extractAuctionName() {
  const metaOgTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
  const source = firstNonEmpty(metaOgTitle, document.title || '');
  const firstSegment = source.split('|')[0] || '';
  const cleaned = firstSegment.replace(/\s+/g, ' ').trim();
  return cleaned || "RM Sotheby's Auction";
}

async function waitForLots({ timeoutMs = 15000 } = {}) {
  const start = Date.now();

  const hasLots = () => {
    const cards = document.querySelectorAll('#search-results-row .search-result');
    if (!cards || cards.length === 0) return false;
    const firstTitle = textFrom(cards[0].querySelector('.lot-title'));
    return firstTitle.length > 0;
  };

  if (hasLots()) return;

  await new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      if (hasLots()) {
        observer.disconnect();
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        observer.disconnect();
        reject(new Error('Timed out waiting for lots to load.'));
      }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    const interval = setInterval(() => {
      if (hasLots()) {
        clearInterval(interval);
        observer.disconnect();
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        observer.disconnect();
        reject(new Error('Timed out waiting for lots to load.'));
      }
    }, 250);
  });
}

async function scrapeRMSothebysLots() {
  const isLotsPage = /\/auctions\/[^/]+\/lots\/?/i.test(window.location.pathname);
  if (!isLotsPage) {
    throw new Error("This doesn't look like an RM Sotheby's lots page.");
  }

  await waitForLots();

  const auctionName = extractAuctionName();
  const auctionUrl = new URL(window.location.href).toString();
  const cards = Array.from(document.querySelectorAll('#search-results-row .search-result'));

  return cards
    .map((card, index) => {
      const title = textFrom(card.querySelector('.lot-title'));
      const estimate = extractEstimateText(card);
      const lotNumber = extractLotNumber(card) || String(index + 1);
      const imageUrl = extractCoverImageUrl(card);
      const shortDescription = extractShortDescription(card);
      const lotUrl = extractLotUrl(card);
      const { estimateLow, estimateHigh, currency } = parseEstimateRange(estimate);

      return {
        auctionHouse: "RM Sotheby's",
        auctionName,
        auctionUrl,
        lotNumber,
        lotTitle: title,
        title,
        lotCoverImageUrl: imageUrl,
        imageUrl,
        estimate,
        estimateLow,
        estimateHigh,
        currency: currency || 'USD',
        shortDescription,
        description: shortDescription,
        lotUrl,
        reserveStatus: 'unknown',
        status: 'upcoming',
        lastUpdated: new Date().toISOString()
      };
    })
    .filter((lot) => lot.title || lot.imageUrl || lot.estimate);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== 'SCRAPE_PAGE') return;

  (async () => {
    try {
      if (window.location.hostname === 'rmsothebys.com') {
        const lots = await scrapeRMSothebysLots();
        sendResponse({ ok: true, data: lots });
        return;
      }

      sendResponse({ ok: false, error: 'Unsupported site.' });
    } catch (err) {
      sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  })();

  return true;
});
