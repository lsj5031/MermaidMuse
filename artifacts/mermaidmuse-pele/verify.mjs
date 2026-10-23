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
assert.deepEqual(errors, []);
await fs.writeFile(
  dir + 'browser-results.json',
  JSON.stringify(
    {
      passed: true,
      pageErrors: errors,
      checks: [
        'sample preview',
        'edit',
        'Dracula theme',
        'SVG download',
        'PNG download',
        'syntax error clears preview/disables export',
        'recovery',
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
