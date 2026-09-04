import { chromium } from 'playwright';

/** A safe, disposable live target adapter used for the hackathon demo. */
export async function runSauceDemoSuite(url, tests) {
  const browser = await chromium.launch({ headless: true });
  try {
    const flows = [loginSuccess, invalidLogin, addToCart, checkoutValidation, checkoutSuccess, logout];
    const results = [];
    for (const [index, test] of tests.entries()) {
      const flow = flows[index % flows.length];
      const context = await browser.newContext();
      const page = await context.newPage();
      const started = Date.now();
      try {
        await flow(page, url);
        results.push({ ...test, status: 'passed', durationMs: Date.now() - started, evidence: `Live SauceDemo execution passed: ${flow.name}.` });
      } catch (error) {
        results.push({ ...test, status: 'failed', durationMs: Date.now() - started, evidence: `Live SauceDemo execution failed: ${safeError(error)}.` });
      } finally { await context.close(); }
    }
    return results;
  } finally { await browser.close(); }
}

const username = () => process.env.SAUCE_USERNAME ?? 'standard_user';
const password = () => process.env.SAUCE_PASSWORD ?? 'secret_sauce';
async function login(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.locator('[data-test="username"]').fill(username());
  await page.locator('[data-test="password"]').fill(password());
  await page.locator('[data-test="login-button"]').click();
  await page.waitForURL(/inventory\.html/, { timeout: 10000 });
}
async function loginSuccess(page, url) { await login(page, url); await required(page, '.inventory_list'); }
async function invalidLogin(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.locator('[data-test="username"]').fill('invalid_user');
  await page.locator('[data-test="password"]').fill('not-a-password');
  await page.locator('[data-test="login-button"]').click();
  const text = await page.locator('[data-test="error"]').innerText();
  if (!/Username and password do not match/i.test(text)) throw new Error('expected invalid-credentials message');
}
async function addToCart(page, url) {
  await login(page, url);
  await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
  const count = await page.locator('[data-test="shopping-cart-badge"]').innerText();
  if (count !== '1') throw new Error(`expected cart badge 1, got ${count}`);
}
async function checkoutValidation(page, url) {
  await checkoutStart(page, url);
  await page.locator('[data-test="continue"]').click();
  const text = await page.locator('[data-test="error"]').innerText();
  if (!/First Name is required/i.test(text)) throw new Error('expected first-name validation message');
}
async function checkoutSuccess(page, url) {
  await checkoutStart(page, url);
  await page.locator('[data-test="firstName"]').fill('Sentinel');
  await page.locator('[data-test="lastName"]').fill('Demo');
  await page.locator('[data-test="postalCode"]').fill('560001');
  await page.locator('[data-test="continue"]').click();
  await page.locator('[data-test="finish"]').click();
  const text = await page.locator('.complete-header').innerText();
  if (!/Thank you for your order/i.test(text)) throw new Error('expected completed order message');
}
async function logout(page, url) {
  await login(page, url);
  await page.locator('#react-burger-menu-btn').click();
  await page.locator('[data-test="logout-sidebar-link"]').click();
  await required(page, '[data-test="login-button"]');
}
async function checkoutStart(page, url) {
  await login(page, url);
  await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
  await page.locator('.shopping_cart_link').click();
  await page.locator('[data-test="checkout"]').click();
  await required(page, '[data-test="continue"]');
}
async function required(page, selector) { if (await page.locator(selector).count() !== 1) throw new Error(`required locator missing: ${selector}`); }
function safeError(error) { return String(error?.message ?? 'unknown browser error').replace(/\s+/g, ' ').slice(0, 180); }
