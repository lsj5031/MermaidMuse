import { chromium } from '/home/leo/.local/share/mise/installs/node/24.20.0/lib/node_modules/openclaw/node_modules/playwright-core/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const dir = new URL('.', import.meta.url).pathname;
const browser = await chromium.launch({
  executablePath: '/home/leo/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
  headless: true,
});
const fixtures = {
  nested: `flowchart TD
subgraph Platform
subgraph Ingestion
A[Receive events] --> B[Validate payload]
end
subgraph Storage
C[(Database)] --> D[Archive]
end
B --> C
end
D --> E[Report]`,
  dense: `flowchart LR
A[Client] --> B[Gateway]
A --> C[Cache]
B --> C
B --> D[Worker]
C --> D
D --> E[(Database)]
E --> B
D --> F[Notifications]
F --> A`,
  long: `flowchart TD
A[Receive and validate a very long customer request with multiple optional configuration values] -->|Validation completed successfully| B[Persist the normalized request and schedule background processing]
B --> C[Send a detailed confirmation message to the customer]`,
  sequence: `sequenceDiagram
participant U as Customer
participant A as API service
participant D as Database
U->>A: Submit request
activate A
A->>D: Save request
D-->>A: Saved
alt Accepted
A-->>U: Confirmation
else Invalid
A-->>U: Error details
end
deactivate A`,
  class: `classDiagram
class Account {
+String name
+save() bool
}
class Customer {
+String email
+placeOrder()
}
class Order {
+int id
+calculateTotal() float
}
Account <|-- Customer
Customer "1" --> "many" Order : places`,
};
const results = { layouts: {}, alpha: [] };
for (const [engine, url, selector] of [
  ['pele', 'http://127.0.0.1:5180', '.pele-output svg'],
  ['old', 'http://127.0.0.1:5181', '.mermaid svg'],
]) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  await page.goto(url);
  // Baseline uses an id-based SVG container; discover it from the rendered preview.
  const svgSelector = engine === 'old' ? 'svg[id^="mermaid"]' : selector;
  await page.locator(svgSelector).first().waitFor();
  const sources = { default: await page.locator('textarea').inputValue(), ...fixtures };
  results.layouts[engine] = {};
  for (const [name, source] of Object.entries(sources)) {
    await page.locator('textarea').fill(source);
    await page.waitForTimeout(1200);
    await page.locator(svgSelector).first().waitFor();
    await page.screenshot({ path: dir + engine + '-' + name + '.png' });
    results.layouts[engine][name] = await page
      .locator(svgSelector)
      .first()
      .evaluate((svg) => ({ viewBox: svg.getAttribute('viewBox'), text: svg.textContent }));
  }
  if (engine === 'pele') {
    for (const theme of ['Avocado', 'Dracula']) {
      await page.getByTitle('Change diagram theme').click();
      await page.getByRole('button', { name: theme, exact: true }).last().click();
      await page.locator('textarea').fill(`flowchart LR
A[Readable node] --> B[Another node]`);
      await page.waitForTimeout(800);
      const preview = await page.locator(selector).evaluate((svg) => ({
        background: getComputedStyle(svg).backgroundColor,
        fill: getComputedStyle(svg.querySelector('.pele-node rect')).fill,
        svg: new XMLSerializer().serializeToString(svg),
      }));
      assert.equal(preview.background, 'rgba(0, 0, 0, 0)');
      assert.notEqual(preview.fill, 'rgba(0, 0, 0, 0)');
      for (const format of ['SVG', 'PNG']) {
        const pending = page.waitForEvent('download');
        await page.getByRole('button', { name: format, exact: true }).click();
        await (
          await pending
        ).saveAs(dir + 'alpha-' + theme.toLowerCase() + '.' + format.toLowerCase());
      }
      const proof = await browser.newPage();
      for (const format of ['svg', 'png']) {
        const filename = 'alpha-' + theme.toLowerCase() + '.' + format;
        const data = await fs.readFile(dir + filename);
        // Decode the actual downloaded file in Chromium and inspect raster pixels.
        await proof.goto('about:blank');
        const alpha = await proof.evaluate(
          async ({ base64, format }) => {
            const image = new Image();
            image.src =
              'data:image/' + (format === 'svg' ? 'svg+xml' : 'png') + ';base64,' + base64;
            await image.decode();
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            const corners = [
              [0, 0],
              [canvas.width - 1, 0],
              [0, canvas.height - 1],
              [canvas.width - 1, canvas.height - 1],
            ].map(([x, y]) => ctx.getImageData(x, y, 1, 1).data[3]);
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let opaque = 0;
            for (let i = 3; i < pixels.length; i += 4) if (pixels[i] === 255) opaque++;
            return { width: canvas.width, height: canvas.height, corners, opaque };
          },
          { base64: data.toString('base64'), format }
        );
        assert.deepEqual(alpha.corners, [0, 0, 0, 0]);
        assert(alpha.opaque > 100);
        results.alpha.push({
          theme,
          format,
          ...alpha,
          previewBackground: preview.background,
          nodeFill: preview.fill,
        });
        await proof.goto('file://' + dir + filename);
        if (format === 'svg') {
          assert.equal(
            await proof.locator('svg').evaluate((svg) => getComputedStyle(svg).backgroundColor),
            'rgba(0, 0, 0, 0)'
          );
          await proof.locator('svg').evaluate(
            (svg, bg) => {
              svg.style.background = bg;
            },
            theme === 'Dracula' ? '#282a36' : '#fcfbf5'
          );
        }
        await proof.screenshot({
          path: dir + 'alpha-' + theme.toLowerCase() + '-' + format + '-standalone.png',
        });
      }
      await proof.close();
    }
  }
  await page.close();
}
await fs.writeFile(dir + 'transparency-layout-results.json', JSON.stringify(results, null, 2));
await browser.close();
console.log('Actual SVG/PNG alpha and layout comparison passed');
