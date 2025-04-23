
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
    throw new Error(`Erro ao processar imagem: ${error.message || 'Erro desconhecido'}`);
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
    throw new Error(`Erro ao processar PDF: ${error.message || 'Erro desconhecido'}`);
  }
};

const parseText = (text: string): ExtractedData[] => {
  console.log('Iniciando análise do texto extraído');
  const lines = text.split('\n').filter(line => line.trim());
  console.log(`Encontradas ${lines.length} linhas para análise`);
  
  const data: ExtractedData[] = [];
  
  // Expressão regular melhorada para capturar preços no formato brasileiro
  const priceRegex = /R\$\s*(\d+[.,]\d{2})/g;
  
  for (const line of lines) {
    let match;
    let lastMatch = null;
    let lastIndex = 0;
    
    // Encontrar todos os preços na linha
    while ((match = priceRegex.exec(line)) !== null) {
      lastMatch = match;
      lastIndex = match.index + match[0].length;
    }
    
    // Se encontrou pelo menos um preço na linha
    if (lastMatch) {
      const price = lastMatch[1].replace(',', '.'); // Normaliza o separador decimal
      
      // Extrai a descrição considerando apenas o texto antes do preço
      let description = line.substring(0, lastMatch.index).trim();
      
      // Se houver texto após o preço, verifica se é uma descrição melhor
      if (lastIndex < line.length) {
        const textAfterPrice = line.substring(lastIndex).trim();
        if (textAfterPrice.length > description.length) {
          description = textAfterPrice;
        }
      }
      
      if (description) {
        data.push({ description, price });
        console.log(`Item encontrado: "${description}" - R$ ${price}`);
      }
    }
  }
  
  console.log(`Total de ${data.length} itens encontrados`);
  return data;
};
