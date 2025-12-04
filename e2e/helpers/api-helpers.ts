/**
 * API mocking and helper utilities for E2E tests
 */

import { Page } from '@playwright/test';

/**
 * Mock API responses in the browser
 */
export async function mockApiResponse(
  page: Page,
  url: string,
  response: any,
  status: number = 200
): Promise<void> {
  await page.route(url, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Wait for API call to complete
 */
export async function waitForApiCall(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 5000
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Intercept and log API calls
 */
export async function interceptApiCalls(page: Page): Promise<Array<{ url: string; method: string; status: number }>> {
  const apiCalls: Array<{ url: string; method: string; status: number }> = [];
  
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('/api/')) {
      apiCalls.push({
        url,
        method: response.request().method(),
        status: response.status(),
      });
    }
  });
  
  return apiCalls;
}




















