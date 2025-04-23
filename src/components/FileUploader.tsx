
import React, { useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileIcon, ImageIcon, Loader2 } from "lucide-react";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, isProcessing }) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  return (
    <Card className="w-full max-w-2xl p-8">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <FileIcon className="w-8 h-8 text-gray-400" />
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600">
            Arraste e solte um arquivo PDF ou imagem aqui, ou
          </p>
          <label htmlFor="file-upload">
            <Button disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Selecionar Arquivo'
              )}
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
            }}
          />
          <p className="text-sm text-gray-500">
            Suporta PDF, PNG, JPG (max. 10MB)
          </p>
        </div>
      </div>
    </Card>
  );
};

export default FileUploader;
