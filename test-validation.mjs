import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'base', securityLevel: 'loose' });

const invalidDiagram = `sequenceDiagram
    participant Buyer
    invalid syntax here
    Buyer->>Seller: test`;

async function test() {
  try {
    console.log('Testing with mermaid.parse...');
    await mermaid.parse(invalidDiagram);
    console.log('PARSE SUCCEEDED (no error caught)');
  } catch (err) {
    console.log('PARSE FAILED:', err.message);
  }
  
  try {
    console.log('\nTesting with mermaid.render...');
    const result = await mermaid.render('test-id', invalidDiagram);
    console.log('RENDER SUCCEEDED:', result);
  } catch (err) {
    console.log('RENDER FAILED');
    console.log('Error message:', err.message);
    console.log('Error str:', err.str);
    console.log('Error name:', err.name);
  }
}

test();
