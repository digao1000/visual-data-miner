
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set the workerSrc property to use pdf.js worker from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ExtractedData {
  description: string;
  price: string;
}

export const extractFromImage = async (file: File): Promise<ExtractedData[]> => {
  try {
    console.log('Iniciando extração da imagem:', file.name);
    const worker = await createWorker('por');
    
    const imageUrl = URL.createObjectURL(file);
    console.log('Imagem convertida para URL, reconhecendo texto...');
    
    const { data: { text } } = await worker.recognize(imageUrl);
    console.log('Texto extraído da imagem:', text);
    
    await worker.terminate();
    URL.revokeObjectURL(imageUrl);
    
    return parseText(text);
  } catch (error) {
    console.error('Erro ao extrair texto da imagem:', error);
    throw new Error(`Erro ao processar imagem: ${(error as Error).message || 'Erro desconhecido'}`);
  }
};

export const extractFromPDF = async (file: File): Promise<ExtractedData[]> => {
  try {
    console.log('Iniciando extração do PDF:', file.name);
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF using pdf.js
    console.log('Carregando PDF...');
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    console.log(`PDF carregado, ${pdf.numPages} páginas encontradas`);
    
    // Extract text from all pages
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processando página ${i} de ${pdf.numPages}`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    console.log('Texto extraído do PDF:', fullText);
    return parseText(fullText);
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error);
    throw new Error(`Erro ao processar PDF: ${(error as Error).message || 'Erro desconhecido'}`);
  }
};

const parseText = (text: string): ExtractedData[] => {
  console.log('Iniciando análise do texto extraído');
  const lines = text.split('\n').filter(line => line.trim());
  console.log(`Encontradas ${lines.length} linhas para análise`);
  
  const data: ExtractedData[] = [];
  
  // Expressões regulares melhoradas para capturar preços no formato brasileiro
  // Tenta vários formatos comuns de preço
  const pricePatterns = [
    /R\$\s*(\d+[.,]\d{2})/g,  // R$ 123,45 ou R$ 123.45
    /(\d+[.,]\d{2})\s*Un/g,   // 123,45 Un ou 123.45 Un
    /(\d+[.,]\d{2})/g         // Qualquer número decimal como backup
  ];
  
  for (const line of lines) {
    console.log(`Analisando linha: ${line}`);
    
    // Tenta cada padrão de preço em ordem
    let found = false;
    for (const pattern of pricePatterns) {
      if (found) break;
      
      pattern.lastIndex = 0; // Reset regex state
      const matches = [...line.matchAll(pattern)];
      if (matches.length > 0) {
        // Pega o último preço na linha como o principal
        const lastMatch = matches[matches.length - 1];
        const price = lastMatch[1].replace(',', '.'); // Normaliza o separador decimal
        
        // Extrai a descrição
        const priceIndex = lastMatch.index || 0;
        const matchLength = lastMatch[0].length;
        
        // Primeiro tenta texto antes do preço
        let description = line.substring(0, priceIndex).trim();
        
        // Se não for suficiente, procura por texto após o preço
        if (description.length < 3) { // Provavelmente não é uma descrição válida
          const afterPriceIndex = priceIndex + matchLength;
          if (afterPriceIndex < line.length) {
            description = line.substring(afterPriceIndex).trim();
          }
        }
        
        // Limpa códigos de barras, números de referência
        description = description.replace(/^\d+\s+/, '');
        
        // Remove parte do preço ou unidade que possa ter sido incluída na descrição
        description = description.replace(/R\$.*$/, '').replace(/\s+Un\s*$/, '').trim();
        
        if (description && description.length > 2) {
          data.push({ description, price });
          console.log(`Item encontrado: "${description}" - R$ ${price}`);
          found = true;
        }
      }
    }
  }
  
  console.log(`Total de ${data.length} itens encontrados`);
  return data;
};
