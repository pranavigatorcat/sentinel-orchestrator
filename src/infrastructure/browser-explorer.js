/** Browser adapter. Kept behind this module so another team can replace Playwright later. */
export async function explore(url, emit) {
  let browser;
  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const snapshot = await page.evaluate(() => ({
      title: document.title,
      url: location.href,
      links: [...document.querySelectorAll('a')].slice(0, 20).map((a) => ({ text: a.innerText.trim(), href: a.href })).filter((a) => a.text),
      controls: [...document.querySelectorAll('button,input,select,textarea')].slice(0, 30).map((e) => ({ tag: e.tagName, text: e.innerText || e.getAttribute('aria-label') || e.name || e.id || e.type || 'control', selector: selectorFor(e) }))
    }));
    emit?.('browser.snapshot', { title: snapshot.title, controls: snapshot.controls.length, links: snapshot.links.length });
    return { ...snapshot, live: true };
  } catch (error) {
    return { title: 'Uninspected target', url, links: [], controls: [], live: false, issue: error.message };
  } finally { await browser?.close(); }
}

function selectorFor(el) {
  if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
  if (el.id) return `#${CSS.escape(el.id)}`;
  if (el.name) return `[name="${el.name}"]`;
  return el.tagName.toLowerCase();
}
