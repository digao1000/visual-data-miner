
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";

interface TextProcessingOptionsProps {
  onWordsChange: (words: string[]) => void;
}

const TextProcessingOptions: React.FC<TextProcessingOptionsProps> = ({ onWordsChange }) => {
  const [words, setWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState('');

  const addWord = () => {
    if (currentWord.trim() && !words.includes(currentWord.trim())) {
      const newWords = [...words, currentWord.trim()];
      setWords(newWords);
      onWordsChange(newWords);
      setCurrentWord('');
    }
  };

  const removeWord = (wordToRemove: string) => {
    const newWords = words.filter(word => word !== wordToRemove);
    setWords(newWords);
    onWordsChange(newWords);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addWord();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-2">
        Adicione palavras que devem ser removidas da descrição durante a exportação.
      </p>
      <div className="flex gap-2">
        <Input
          value={currentWord}
          onChange={(e) => setCurrentWord(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite uma palavra para remover"
          className="flex-1"
        />
        <Button 
          onClick={addWord} 
          type="button" 
          size="icon" 
          className="shrink-0"
          disabled={!currentWord.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {words.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {words.map((word, index) => (
            <div
              key={index}
              className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full text-sm transition-all hover:bg-secondary/80"
            >
              <span className="font-medium">{word}</span>
              <button
                onClick={() => removeWord(word)}
                className="hover:text-destructive focus:outline-none"
                aria-label={`Remover ${word}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {words.length === 0 && (
        <p className="text-xs text-gray-500 italic">
          Nenhuma palavra adicionada.
        </p>
      )}
    </div>
  );
};

export default TextProcessingOptions;
