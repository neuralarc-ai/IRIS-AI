"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Papa, { ParseResult } from 'papaparse';

interface CSVImportProps {
  type: 'leads' | 'accounts' | 'opportunities';
  onImport: (data: any[]) => void;
  templateUrl?: string;
}

interface CSVRow {
  [key: string]: string;
}

export default function CSVImport({ type, onImport, templateUrl }: CSVImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      await processFile(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setIsLoading(true);

    try {
      const text = await file.text();
      Papa.parse<CSVRow>(text, {
        header: true,
        complete: (results: ParseResult<CSVRow>) => {
          onImport(results.data);
          toast({
            title: "Success",
            description: `Successfully imported ${results.data.length} ${type}`,
          });
        },
        error: (error: Error) => {
          toast({
            title: "Error",
            description: "Failed to parse CSV file",
            variant: "destructive"
          });
        }
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Import {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
          {templateUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={templateUrl} download className="flex items-center">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Download Template
              </a>
            </Button>
          )}
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Drag and drop your CSV file here, or click to select
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Only CSV files are supported
            </p>
          </label>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
            Processing file...
          </div>
        )}
      </div>
    </Card>
  );
} 