
import React, { useCallback, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileIcon, ImageIcon, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/pdf', 
      'image/png', 
      'image/jpeg', 
      'image/jpg', 
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
      toast.error('Formato de arquivo não suportado. Por favor, use PDF, PNG, JPG ou Excel.');
      return false;
    }
    
    if (file.size > maxSize) {
      toast.error('O arquivo é muito grande. O tamanho máximo é 10MB.');
      return false;
    }
    
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
    // Reset the input to allow selecting the same file again
    e.target.value = '';
  };

  const handleButtonClick = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <Card className="w-full max-w-2xl p-6 shadow-lg border-2 transition-all hover:border-primary/20">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragActive ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-gray-300'
        }`}
      >
        <div className="flex flex-col items-center gap-5">
          <div className="flex gap-3 animate-pulse">
            <FileIcon className="w-8 h-8 text-blue-400" />
            <ImageIcon className="w-8 h-8 text-green-400" />
            <FileSpreadsheet className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-gray-600 font-medium">
            Arraste e solte um arquivo PDF, Excel ou imagem aqui, ou
          </p>
          <Button 
            onClick={handleButtonClick}
            disabled={isProcessing}
            type="button"
            className="px-6 py-2 font-medium transition-all hover:scale-105"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              'Selecionar Arquivo'
            )}
          </Button>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
          <p className="text-sm text-gray-500 mt-1">
            Suporta PDF, Excel, PNG, JPG (max. 10MB)
          </p>
        </div>
      </div>
    </Card>
  );
};

export default FileUploader;
