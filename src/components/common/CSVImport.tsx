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
          
          const totalRows = results.data.length;
          console.log('🔍 Starting email validation...');
          
          const validData = results.data.filter((row, index) => {
            console.log(`🔍 Row ${index} full data:`, row);
            
            // Check for email field with various possible names (case-insensitive)
            const possibleEmailFields = ['email', 'Email', 'EMAIL', 'e-mail', 'e_mail', 'email_address', 'emailAddress', 'contact_email', 'contactEmail'];
            let emailValue = null;
            let emailFieldName = null;
            
            // Find the email field (case-insensitive)
            for (const fieldName of possibleEmailFields) {
              if (row.hasOwnProperty(fieldName)) {
                emailValue = row[fieldName];
                emailFieldName = fieldName;
                console.log(`🔍 Row ${index} email found with field name: ${fieldName}`);
                break;
              }
            }
            
            // Also check all fields for any that contain 'email' (case-insensitive)
            if (!emailValue) {
              for (const [key, value] of Object.entries(row)) {
                if (key.toLowerCase().includes('email')) {
                  emailValue = value;
                  emailFieldName = key;
                  console.log(`🔍 Row ${index} email found with partial match: ${key}`);
                  break;
                }
              }
            }
            
            console.log(`🔍 Row ${index} email field found:`, emailFieldName);
            console.log(`🔍 Row ${index} email value:`, emailValue);
            console.log(`🔍 Row ${index} email type:`, typeof emailValue);
            console.log(`🔍 Row ${index} email length:`, emailValue ? emailValue.length : 'null/undefined');
            
            // More flexible email validation - accept any non-empty value
            const hasEmail = emailValue && emailValue.toString().trim() !== '';
            console.log(`Row ${index}: email="${emailValue}" - Valid: ${hasEmail}`);
            return hasEmail;
          });

          const rejectedCount = totalRows - validData.length;
          console.log('📊 Validation results:', {
            totalRows,
            validDataCount: validData.length,
            rejectedCount,
            validData
          });

          if (validData.length > 0) {
            console.log('✅ Valid data found, calling onImport...');
            onImport(validData);
            let description = `Successfully imported ${validData.length} ${type}.`;
            if (rejectedCount > 0) {
              description += ` ${rejectedCount} row(s) rejected due to missing or empty email.`;
            }
            console.log('📢 Showing success toast:', description);
            toast({
              title: "Import Complete",
              description: description,
              variant: "default"
            });
          } else {
            console.log('❌ No valid data found after validation');
            toast({
              title: "No valid data to import",
              description: `All ${totalRows} row(s) rejected due to missing or empty email.`, 
              variant: "destructive"
            });
          }
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