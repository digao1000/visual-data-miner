
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

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
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={currentWord}
            onChange={(e) => setCurrentWord(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite uma palavra para remover"
            className="flex-1"
          />
          <Button onClick={addWord} type="button">
            Adicionar
          </Button>
        </div>
        
        {words.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {words.map((word, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md"
              >
                <span>{word}</span>
                <button
                  onClick={() => removeWord(word)}
                  className="hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TextProcessingOptions;
