
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';

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

export const extractFromExcel = async (file: File): Promise<ExtractedData[]> => {
  try {
    console.log('Iniciando extração do Excel:', file.name);
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the Excel file
    console.log('Carregando arquivo Excel...');
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    console.log('Excel carregado, processando planilhas...');
    
    // Get the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert Excel to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Convertido ${jsonData.length} linhas para JSON`);
    
    // Process the JSON data to match ExtractedData format
    // Try to find columns related to description and price
    const extractedData: ExtractedData[] = [];
    
    if (jsonData.length > 0) {
      // Let's see what columns we have available
      console.log('Analisando colunas disponíveis:', Object.keys(jsonData[0]));
      
      // Attempt to identify description and price columns based on common names
      const possibleDescriptionKeys = ['descricao', 'descrição', 'desc', 'produto', 'product', 'description', 'item', 'nome'];
      const possiblePriceKeys = ['preco', 'preço', 'price', 'valor', 'value', 'total'];
      
      // Try to find the best matching keys for description and price
      const descKey = findBestMatchingKey(jsonData[0], possibleDescriptionKeys);
      const priceKey = findBestMatchingKey(jsonData[0], possiblePriceKeys);
      
      console.log(`Colunas identificadas - Descrição: ${descKey}, Preço: ${priceKey}`);
      
      if (descKey && priceKey) {
        // We found both description and price columns
        jsonData.forEach((row: any) => {
          if (row[descKey] && row[priceKey]) {
            const description = String(row[descKey]).trim();
            let price = String(row[priceKey]);
            
            // Format price to match expected format
            if (!isNaN(Number(price))) {
              // Convert numeric price to string with decimal places
              price = Number(price).toFixed(2);
            }
            
            extractedData.push({ description, price });
          }
        });
      } else {
        // If we couldn't identify columns, take the first column as description and second as price
        jsonData.forEach((row: any) => {
          const keys = Object.keys(row);
          if (keys.length >= 2) {
            const description = String(row[keys[0]]).trim();
            let price = String(row[keys[1]]);
            
            // Format price to match expected format
            if (!isNaN(Number(price))) {
              price = Number(price).toFixed(2);
            }
            
            extractedData.push({ description, price });
          }
        });
      }
    }
    
    console.log(`Total de ${extractedData.length} itens extraídos do Excel`);
    return extractedData;
  } catch (error) {
    console.error('Erro ao extrair dados do Excel:', error);
    throw new Error(`Erro ao processar Excel: ${(error as Error).message || 'Erro desconhecido'}`);
  }
};

// Helper function to find the best matching key in an object
const findBestMatchingKey = (obj: any, possibleKeys: string[]): string | null => {
  const keys = Object.keys(obj).map(k => k.toLowerCase());
  
  // First try exact match
  for (const possible of possibleKeys) {
    const match = keys.find(k => k === possible.toLowerCase());
    if (match) {
      return Object.keys(obj).find(k => k.toLowerCase() === match) || null;
    }
  }
  
  // Then try partial match
  for (const possible of possibleKeys) {
    const match = keys.find(k => k.includes(possible.toLowerCase()));
    if (match) {
      return Object.keys(obj).find(k => k.toLowerCase() === match) || null;
    }
  }
  
  return null;
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
