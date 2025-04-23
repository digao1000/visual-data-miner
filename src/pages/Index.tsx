
import React, { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { extractFromImage, extractFromPDF, ExtractedData } from '@/utils/dataExtractor';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

const Index = () => {
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (file: File) => {
    try {
      setIsProcessing(true);
      const data = file.type.includes('pdf') 
        ? await extractFromPDF(file)
        : await extractFromImage(file);
      
      setExtractedData(data);
      toast.success(`${data.length} items extraídos com sucesso!`);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Erro ao processar o arquivo. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      'Descrição,Preço',
      ...extractedData.map(item => `"${item.description}","${item.price}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'dados_extraidos.csv');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Extrator de Dados de PDF e Imagens
        </h1>
        
        <FileUploader 
          onFileSelect={handleFileSelect}
          isProcessing={isProcessing}
        />

        {extractedData.length > 0 && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Dados Extraídos ({extractedData.length} items)
              </h2>
              <Button onClick={exportToCSV}>
                Exportar CSV
              </Button>
            </div>
            
            <div className="overflow-auto max-h-96">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Descrição</th>
                    <th className="text-right p-2">Preço (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedData.map((item, index) => (
                    <tr key={index} className="border-b">
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
