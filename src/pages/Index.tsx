
import React, { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { extractFromImage, extractFromPDF, ExtractedData } from '@/utils/dataExtractor';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800">
          Extrator de Dados de PDF e Imagens
        </h1>
        
        <FileUploader 
          onFileSelect={handleFileSelect}
          isProcessing={isProcessing}
        />

        {isProcessing && (
          <div className="flex justify-center">
            <Card className="p-6 flex items-center gap-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Processando arquivo... Por favor, aguarde.</span>
            </Card>
          </div>
        )}

        {extractedData.length > 0 && !isProcessing && (
          <Card className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
              <h2 className="text-lg md:text-xl font-semibold">
                Dados Extraídos ({extractedData.length} itens)
              </h2>
              <Button onClick={exportToCSV}>
                Exportar CSV
              </Button>
            </div>
            
            <div className="overflow-auto max-h-96 rounded border">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-2 border-b">Descrição</th>
                    <th className="text-right p-2 border-b">Preço (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedData.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">{item.description}</td>
                      <td className="text-right p-2">{item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
