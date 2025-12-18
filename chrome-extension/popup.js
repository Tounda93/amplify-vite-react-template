const scrapeButton = document.getElementById('scrape');
const copyButton = document.getElementById('copy');
const statusEl = document.getElementById('status');
const outputEl = document.getElementById('output');

function setStatus(message) {
  statusEl.textContent = message || '';
}

function setBusy(isBusy) {
  scrapeButton.disabled = isBusy;
  if (isBusy) copyButton.disabled = true;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab found.');
  return tab;
}

async function sendScrapeMessage(tabId) {
  try {
    return await chrome.tabs.sendMessage(tabId, { type: 'SCRAPE_PAGE' });
  } catch (err) {
    // If the content script wasn't injected (or the page was just opened), try injecting and retry once.
    await chrome.scripting.executeScript({ target: { tabId }, files: ['contentScript.js'] });
    return await chrome.tabs.sendMessage(tabId, { type: 'SCRAPE_PAGE' });
  }
}

scrapeButton.addEventListener('click', async () => {
  setBusy(true);
  setStatus('Scraping…');
  outputEl.value = '';

  try {
    const tab = await getActiveTab();
    const response = await sendScrapeMessage(tab.id);

    if (!response?.ok) {
      throw new Error(response?.error || 'Scrape failed.');
    }

    outputEl.value = JSON.stringify(response.data, null, 2);
    copyButton.disabled = false;
    setStatus(`Done. Found ${Array.isArray(response.data) ? response.data.length : 0} lot(s).`);
  } catch (err) {
    setStatus(err instanceof Error ? err.message : String(err));
  } finally {
    setBusy(false);
  }
});

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(outputEl.value || '');
    setStatus('Copied to clipboard.');
  } catch (err) {
    setStatus('Copy failed. You can manually select + copy the JSON.');
  }
});
