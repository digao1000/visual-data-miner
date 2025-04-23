
import { createWorker } from 'tesseract.js';
import pdfParse from 'pdf-parse';

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
  const data = await pdfParse(arrayBuffer);
  return parseText(data.text);
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
