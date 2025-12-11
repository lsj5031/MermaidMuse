import html2canvas from 'html2canvas';

export async function exportDiagramAsPNG(elementId: string, filename: string): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id ${elementId} not found`);
    }

    const canvas = await html2canvas(element, {
      backgroundColor: '#0a0e27',
      scale: 2,
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${filename}.png`;
    link.click();
  } catch (error) {
    console.error('Failed to export diagram:', error);
    throw error;
  }
}

export function exportDiagramAsJSON(content: string, filename: string): void {
  try {
    const dataStr = JSON.stringify({ content }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    link.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export diagram as JSON:', error);
    throw error;
  }
}

export function exportDiagramAsText(content: string, filename: string): void {
  try {
    const dataBlob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.mmd`;
    link.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export diagram as text:', error);
    throw error;
  }
}
