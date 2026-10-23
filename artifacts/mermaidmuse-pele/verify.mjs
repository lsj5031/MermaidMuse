import { chromium } from '/home/leo/.local/share/mise/installs/node/24.20.0/lib/node_modules/openclaw/node_modules/playwright-core/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const dir = new URL('.', import.meta.url).pathname;
const browser = await chromium.launch({
  executablePath: '/home/leo/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(process.env.APP_URL || 'http://127.0.0.1:5180');
await page.locator('.pele-output svg').waitFor();
await page
  .locator('.pele-output')
  .evaluateAll((els) => els.forEach((el) => el.getAnimations().forEach((a) => a.finish())));
await page.screenshot({ path: dir + 'sample.png' });
const editor = page.locator('textarea');
await editor.fill('flowchart LR\nA[Latest edit] --> B[Exported]'.replaceAll('\\n', '\n'));
await page.getByText('Ready', { exact: true }).waitFor();
await page.getByTitle('Change diagram theme').click();
await page.getByRole('button', { name: 'Dracula', exact: true }).click();
await page.waitForFunction(() =>
  document.querySelector('.pele-output svg')?.getAttribute('style').includes('--pele-bg:#282A36')
);
await page
  .locator('.pele-output')
  .evaluateAll((els) => els.forEach((el) => el.getAnimations().forEach((a) => a.finish())));
await page.screenshot({ path: dir + 'dracula.png' });
for (const format of ['SVG', 'PNG']) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: format, exact: true }).click();
  const download = await pending;
  await download.saveAs(dir + 'diagram.' + format.toLowerCase());
}
await editor.fill('graph TD\nA -->'.replaceAll('\\n', '\n'));
await page.getByText('Unable to render diagram', { exact: true }).waitFor();
await page.waitForFunction(
  () => document.querySelector('button[title="Fix errors to export"]')?.disabled
);
assert.equal(await page.locator('.pele-output svg').count(), 0);
await page
  .locator('.pele-output')
  .evaluateAll((els) => els.forEach((el) => el.getAnimations().forEach((a) => a.finish())));
await page.screenshot({ path: dir + 'error.png' });
await editor.fill('sankey-beta\nA,B,3\nB,A,2');
await page.getByText('Unable to render diagram', { exact: true }).waitFor();
await page.waitForFunction(
  () =>
    [...document.querySelectorAll('button[title="Fix errors to export"]')].length === 2 &&
    [...document.querySelectorAll('button[title="Fix errors to export"]')].every(
      (button) => button.disabled
    )
);
await page
  .getByText(/circular/i)
  .first()
  .waitFor();
assert.equal(await page.locator('.pele-output svg').count(), 0);
await page.getByText('1 error', { exact: true }).waitFor();
assert(await page.getByRole('button', { name: 'SVG', exact: true }).isDisabled());
assert(await page.getByRole('button', { name: 'PNG', exact: true }).isDisabled());
await page.screenshot({ path: dir + 'circular-error.png' });
await editor.fill('sequenceDiagram\nAlice->>Bob: Recovered'.replaceAll('\\n', '\n'));
await page.locator('.pele-output svg').waitFor();
await page.getByText('Diagram is valid', { exact: true }).waitFor();
await page.waitForFunction(() =>
  localStorage.getItem('mermaidMuse.content')?.includes('Recovered')
);
await page.reload();
await page.locator('.pele-output svg').waitFor();
assert.match(await editor.inputValue(), /Recovered/);
await page
  .locator('.pele-output')
  .evaluateAll((els) => els.forEach((el) => el.getAnimations().forEach((a) => a.finish())));
await page.screenshot({ path: dir + 'recovered.png' });
const svg = await fs.readFile(dir + 'diagram.svg', 'utf8');
assert.match(svg, /Latest edit/);
assert.match(svg, /--pele-bg:#282A36/);
assert.match(svg, /MermaidMuse/);
// Open exports independently, with no app CSS.
const standalone = await browser.newPage({ viewport: { width: 900, height: 500 } });
await standalone.goto('file://' + dir + 'diagram.svg');
await standalone.screenshot({ path: dir + 'standalone-svg.png' });
await standalone.goto('file://' + dir + 'diagram.png');
await standalone.screenshot({ path: dir + 'standalone-png.png' });
// Exercise the narrowest reported fixture through the actual download buttons.
await editor.fill('graph TD\nA');
await page.getByText('Diagram is valid', { exact: true }).waitFor();
for (const format of ['SVG', 'PNG']) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: format, exact: true }).click();
  await (await pending).saveAs(dir + 'narrow.' + format.toLowerCase());
}
await standalone.goto('file://' + dir + 'narrow.svg');
const geometry = await standalone.evaluate(() => {
  const svg = document.querySelector('svg');
  const footer = svg.lastElementChild;
  const box = footer.getBBox();
  return {
    width: svg.width.baseVal.value,
    height: svg.height.baseVal.value,
    viewBox: svg.getAttribute('viewBox'),
    footer: { x: box.x, y: box.y, width: box.width, height: box.height },
  };
});
assert(geometry.footer.x >= 8);
// Glyph ink can overhang the end anchor slightly; it must remain inside the image.
assert(geometry.footer.x + geometry.footer.width <= geometry.width);
assert(geometry.footer.y >= geometry.height - 28);
assert(geometry.footer.y + geometry.footer.height <= geometry.height);
assert.equal(geometry.viewBox, `0 0 ${geometry.width} ${geometry.height}`);
await standalone.screenshot({ path: dir + 'narrow-standalone-svg.png' });
await standalone.goto('file://' + dir + 'narrow.png');
const pngGeometry = await standalone.locator('img').evaluate(async (image) => {
  await image.decode();
  return { width: image.naturalWidth, height: image.naturalHeight };
});
assert.equal(pngGeometry.width, Math.ceil(geometry.width * 2));
assert.equal(pngGeometry.height, Math.ceil(geometry.height * 2));
await standalone.screenshot({ path: dir + 'narrow-standalone-png.png' });
assert.deepEqual(errors, []);
await fs.writeFile(
  dir + 'browser-results.json',
  JSON.stringify(
    {
      passed: true,
      narrowSvg: geometry,
      narrowPng: pngGeometry,
      pageErrors: errors,
      checks: [
        'sample preview',
        'edit',
        'Dracula theme',
        'SVG download',
        'PNG download',
        'syntax error clears preview/disables export',
        'circular Sankey clears preview/disables both exports',
        'recovery',
        'narrow standalone SVG footer bounds and PNG dimensions',
        'reload persistence',
        'standalone exports',
      ],
    },
    null,
    2
  )
);
await browser.close();
console.log('Browser and exports passed');
