import type { APIRoute } from 'astro';
import { renderResume, getAvailablePages } from '~/resume/render';
import puppeteer from 'puppeteer';

export function getStaticPaths() {
  return getAvailablePages();
}

export const get: APIRoute = async function get(context) {
  const { authorLang } = context.params;
  const lang = authorLang!.split('_')[1]!;

  // Load rendered HTML in browser
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(renderResume(lang!, true));
  await page.waitForNetworkIdle();

  // Render a PDF
  const pdf = await page.pdf({ format: 'A4' });

  return {
    body: pdf,
    encoding: 'binary',
  };
};
