
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set the workerSrc property to use pdf.js worker from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ExtractedData {
  description: string;
  price: string;
}

export const extractFromImage = async (file: File): Promise<ExtractedData[]> => {
  const worker = await createWorker('por');
  
  const imageUrl = URL.createObjectURL(file);
  const { data: { text } } = await worker.recognize(imageUrl);
  
  await worker.terminate();
  URL.revokeObjectURL(imageUrl);
  
  return parseText(text);
};

export const extractFromPDF = async (file: File): Promise<ExtractedData[]> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the PDF using pdf.js
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  // Extract text from all pages
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return parseText(fullText);
};

const parseText = (text: string): ExtractedData[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const data: ExtractedData[] = [];
  
  for (const line of lines) {
    const priceMatch = line.match(/R\$\s*(\d+[.,]\d{2})/);
    if (priceMatch && line.length > priceMatch[0].length) {
      const price = priceMatch[1];
      const description = line.replace(priceMatch[0], '').trim();
      if (description) {
        data.push({ description, price });
      }
    }
  }
  
  return data;
};
