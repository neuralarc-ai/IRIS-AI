"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Papa, { ParseResult } from 'papaparse';

interface CSVImportProps {
  type: 'leads' | 'accounts' | 'opportunities';
  onImport: (data: any[], rejectedData: any[]) => void;
  templateUrl?: string;
  disabled?: boolean;
}

interface CSVRow {
  [key: string]: string;
}

interface RejectedRow extends CSVRow {
  _errors?: string[];
}

export default function CSVImport({ type, onImport, templateUrl, disabled = false }: CSVImportProps) {
  console.log('🔄 CSVImport component rendered with props:', { type, templateUrl });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  console.log('🔄 CSVImport component state:', { isDragging, isLoading });

  const handleDragOver = (e: React.DragEvent) => {
    console.log('🔄 handleDragOver triggered');
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    console.log('🔄 handleDragLeave triggered');
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    console.log('🔄 handleDrop triggered - START');
    e.preventDefault();
    setIsDragging(false);
    
    console.log('🔄 CSV Import: handleDrop triggered');
    const file = e.dataTransfer.files[0];
    console.log('📁 Dropped file:', file);
    
    if (file && file.type === 'text/csv') {
      console.log('✅ File type validation passed - CSV file detected');
      await processFile(file);
    } else {
      console.log('❌ File type validation failed:', file?.type);
      toast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
    }
    console.log('🔄 handleDrop triggered - END');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔄 handleFileSelect triggered - START');
    console.log('🔄 CSV Import: handleFileSelect triggered');
    console.log('🔄 Event target files:', e.target.files);
    const file = e.target.files?.[0];
    console.log('📁 Selected file:', file);
    
    if (file) {
      console.log('✅ File selected successfully');
      await processFile(file);
    } else {
      console.log('❌ No file selected');
    }
    console.log('🔄 handleFileSelect triggered - END');
  };

  const processFile = async (file: File) => {
    console.log('🔄 CSV Import: processFile started');
    console.log('📁 Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);
    setIsLoading(true);

    try {
      console.log('📖 Reading file content...');
      const text = await file.text();
      console.log('📄 File content length:', text.length);
      console.log('📄 First 200 characters:', text.substring(0, 200));
      
      console.log('🔍 Starting CSV parsing with Papa.parse...');
      Papa.parse<CSVRow>(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results: ParseResult<CSVRow>) => {
          console.log('✅ CSV parsing completed');
          console.log('📊 Parse results:', results);
          console.log('📊 Total rows parsed:', results.data.length);
          console.log('📊 Sample row:', results.data[0]);
          console.log('📊 All parsed data:', results.data);
          
          // Log the headers/columns from the CSV
          if (results.data.length > 0) {
            console.log('📋 CSV Headers/Columns:', Object.keys(results.data[0]));
            console.log('📋 Available fields in first row:', results.data[0]);
          }
          
          const validData: CSVRow[] = [];
          const rejectedData: RejectedRow[] = [];

          results.data.forEach((row, index) => {
            const errors: string[] = [];
            
            // Clean up and validate company name
            const companyName = (row.company_name || row.companyName || row['Company Name'] || '').trim();
            if (!companyName) {
              errors.push('Company Name is missing');
            }

            // Clean up and validate person name
            const personName = (row.person_name || row.personName || row['Person Name'] || row['Contact Person'] || row['Contact Name'] || '').trim();
            if (!personName) {
              errors.push('Person Name is missing');
            }
            
            // Clean up and validate email
            let emailValue = (row.email || row.Email || row['Email Address'] || '').trim();
            if (emailValue.includes('mailto:')) {
              emailValue = emailValue.replace('mailto:', '').split(':')[0];
            }
            if (!emailValue) {
              errors.push('Email is missing');
            } else if (!emailValue.includes('@')) {
              errors.push('Email is invalid (must contain @)');
            }

            // Clean up optional fields
            const phone = (row.phone || row.Phone || row['Phone Number'] || '').trim();
            const linkedinUrl = (row.linkedin_profile_url || row.linkedinProfileUrl || row['LinkedIn Profile'] || row['LinkedIn URL'] || '').trim();
            const country = (row.country || row.Country || row['Country/Region'] || '').trim();

            const processedRow = {
              company_name: companyName,
              person_name: personName,
              email: emailValue,
              phone,
              linkedin_profile_url: linkedinUrl,
              country,
              status: 'New' as const,
              _originalRow: { ...row },
              _rowIndex: index,
              _errors: errors
            };

            if (errors.length > 0) {
              rejectedData.push(processedRow);
            } else {
              validData.push(processedRow);
            }
          });

          console.log('📊 Validation results:', {
            totalRows: results.data.length,
            validCount: validData.length,
            rejectedCount: rejectedData.length,
            rejectedData
          });

          onImport(validData, rejectedData);
          
          const description = `Processed ${results.data.length} records. ${validData.length} valid, ${rejectedData.length} rejected.`;
          toast({
            title: "Import Complete",
            description: description,
            variant: "default"
          });
        },
        error: (error: Error) => {
          console.error('❌ CSV parsing error:', error);
          toast({
            title: "Error",
            description: "Failed to parse CSV file",
            variant: "destructive"
          });
        }
      });
    } catch (error) {
      console.error('❌ File processing error:', error);
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive"
      });
    } finally {
      console.log('🔄 CSV Import: processFile completed');
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
          } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
          onDragOver={disabled ? undefined : handleDragOver}
          onDragLeave={disabled ? undefined : handleDragLeave}
          onDrop={disabled ? undefined : handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            onChange={disabled ? undefined : handleFileSelect}
            className="hidden"
            id="csv-upload"
            disabled={disabled}
          />
          <label
            htmlFor="csv-upload"
            className={`cursor-pointer flex flex-col items-center ${disabled ? 'pointer-events-none' : ''}`}
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Drag and drop your CSV file here, or click to select
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Only CSV files are supported
            </p>
          </label>
          {disabled && (
            <div className="absolute inset-0 bg-white/60 z-20 rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground font-medium">Importing...</span>
            </div>
          )}
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