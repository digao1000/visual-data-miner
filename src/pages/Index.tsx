
import React, { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { extractFromImage, extractFromPDF, ExtractedData } from '@/utils/dataExtractor';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { Loader2, Table as TableIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Index = () => {
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = async (file: File) => {
    try {
      setIsProcessing(true);
      setSelectedFile(file);
      toast.info(`Processando arquivo: ${file.name}`);
      
      const data = file.type.includes('pdf') 
        ? await extractFromPDF(file)
        : await extractFromImage(file);
      
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

  const exportToCSV = () => {
    if (extractedData.length === 0) {
      toast.warning('Não há dados para exportar.');
      return;
    }
    
    const csvContent = [
      'Descrição,Preço',
      ...extractedData.map(item => `"${item.description}","${item.price}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const filename = selectedFile 
      ? `dados_extraidos_${selectedFile.name.split('.')[0]}.csv`
      : 'dados_extraidos.csv';
    
    saveAs(blob, filename);
    toast.success('Arquivo CSV exportado com sucesso!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800">
          Extrator de Dados de PDF e Imagens
        </h1>
        
        <FileUploader 
          onFileSelect={handleFileSelect}
          isProcessing={isProcessing}
        />

        {isProcessing && (
          <Card className="p-6 flex items-center justify-center gap-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Processando arquivo... Por favor, aguarde.</span>
          </Card>
        )}

        {extractedData.length > 0 && !isProcessing && (
          <Card className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <TableIcon className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg md:text-xl font-semibold">
                  Dados Extraídos ({extractedData.length} itens)
                </h2>
              </div>
              <Button onClick={exportToCSV}>
                Exportar CSV
              </Button>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] font-semibold">Nº</TableHead>
                    <TableHead className="font-semibold">Descrição</TableHead>
                    <TableHead className="text-right font-semibold">Preço (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractedData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.price}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
