
import React, { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { extractFromImage, extractFromPDF, extractFromExcel, ExtractedData } from '@/utils/dataExtractor';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { Loader2, Table as TableIcon, Download, FileSpreadsheet } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TextProcessingOptions from '@/components/TextProcessingOptions';

const Index = () => {
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [wordsToRemove, setWordsToRemove] = useState<string[]>([]);

  const handleFileSelect = async (file: File) => {
    try {
      setIsProcessing(true);
      setSelectedFile(file);
      toast.info(`Processando arquivo: ${file.name}`);
      
      let data: ExtractedData[] = [];
      
      // Determine file type and use appropriate extractor
      if (file.type.includes('pdf')) {
        data = await extractFromPDF(file);
      } else if (file.type.includes('image')) {
        data = await extractFromImage(file);
      } else if (file.type.includes('spreadsheet') || file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        data = await extractFromExcel(file);
      } else {
        throw new Error('Tipo de arquivo não suportado');
      }
      
      if (data.length === 0) {
        toast.warning('Nenhum item foi detectado no arquivo. Tente outro arquivo ou formato.');
      } else {
        setExtractedData(data);
        toast.success(`${data.length} itens extraídos com sucesso!`);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(`Erro ao processar o arquivo: ${(error as Error).message || 'Tente novamente'}`);
      setExtractedData([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const processDescription = (description: string): string => {
    let processedText = description;
    wordsToRemove.forEach(word => {
      const regex = new RegExp(word, 'gi');
      processedText = processedText.replace(regex, '').trim();
    });
    return processedText;
  };

  const exportToCSV = () => {
    if (extractedData.length === 0) {
      toast.warning('Não há dados para exportar.');
      return;
    }
    
    const csvContent = [
      'Descrição,Preço',
      ...extractedData.map(item => `"${processDescription(item.description)}","${item.price}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const filename = selectedFile 
      ? `dados_extraidos_${selectedFile.name.split('.')[0]}.csv`
      : 'dados_extraidos.csv';
    
    saveAs(blob, filename);
    toast.success('Arquivo CSV exportado com sucesso!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4 pb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Extrator de Dados
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Extraia facilmente dados de arquivos PDF, Excel e imagens com reconhecimento automático de descrições e preços.
          </p>
        </div>
        
        <div className="flex justify-center">
          <FileUploader 
            onFileSelect={handleFileSelect}
            isProcessing={isProcessing}
          />
        </div>

        {isProcessing && (
          <Card className="p-6 flex items-center justify-center gap-4 shadow-md animate-pulse bg-white/80 backdrop-blur">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-lg font-medium">Processando arquivo... Por favor, aguarde.</span>
          </Card>
        )}

        {extractedData.length > 0 && !isProcessing && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="col-span-1 shadow-md hover:shadow-lg transition-all h-fit">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Opções de Processamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TextProcessingOptions onWordsChange={setWordsToRemove} />
              </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2 border-b">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                    <TableIcon className="h-5 w-5 text-primary" />
                    Dados Extraídos ({extractedData.length} itens)
                  </CardTitle>
                  <Button onClick={exportToCSV} className="gap-1 flex items-center">
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4 pb-2">
                <div className="rounded-md border overflow-hidden">
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-muted/50 sticky top-0">
                        <TableRow>
                          <TableHead className="w-[80px] font-bold text-gray-800">Nº</TableHead>
                          <TableHead className="font-bold text-gray-800">Descrição</TableHead>
                          <TableHead className="text-right font-bold text-gray-800 w-[120px]">Preço (R$)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {extractedData.map((item, index) => (
                          <TableRow key={index} className="hover:bg-muted/30">
                            <TableCell className="font-medium text-gray-700">{index + 1}</TableCell>
                            <TableCell className="text-gray-700">{item.description}</TableCell>
                            <TableCell className="text-right font-semibold text-gray-800">{item.price}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
