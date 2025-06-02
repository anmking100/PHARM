"use client";

import { useState, useEffect } from 'react';
import FaxUploadForm from '@/components/medication/FaxUploadForm';
import FaxDisplay from '@/components/medication/FaxDisplay';
import ExtractedDataForm from '@/components/medication/ExtractedDataForm';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { extractMedicationData } from '@/ai/flows/extract-medication-data';
import type { MedicationData } from '@/lib/types';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [faxDataUri, setFaxDataUri] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<MedicationData | null>(null);
  const [isProcessingFax, setIsProcessingFax] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File | null) => {
    setSelectedFile(file);
    setError(null);
    setExtractedData(null); 
    if (file) {
      try {
        const dataUri = await fileToDataUri(file);
        setFaxDataUri(dataUri);
      } catch (e) {
        console.error("Error converting file to data URI:", e);
        setError("Failed to load the fax image. Please try again.");
        setFaxDataUri(null);
        toast({
          variant: "destructive",
          title: "File Error",
          description: "Could not read the selected file.",
        });
      }
    } else {
      setFaxDataUri(null);
    }
  };

  const handleProcessFax = async () => {
    if (!faxDataUri) {
      setError("No fax document uploaded to process.");
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: "Please upload a fax document first.",
      });
      return;
    }

    setIsProcessingFax(true);
    setIsProcessingAi(true);
    setError(null);
    setExtractedData(null);

    try {
      const result = await extractMedicationData({ faxDataUri });
      setExtractedData(result);
      toast({
        title: "Processing Complete",
        description: "Fax data extracted successfully.",
      });
    } catch (e: any) {
      console.error("Error processing fax with AI:", e);
      const errorMessage = e.message || "An unknown error occurred during AI processing.";
      setError(`Failed to process fax: ${errorMessage}`);
      setExtractedData(null);
      toast({
        variant: "destructive",
        title: "AI Processing Error",
        description: `Could not extract data from fax. ${errorMessage}`,
      });
    } finally {
      setIsProcessingFax(false);
      setIsProcessingAi(false);
    }
  };

  const handleDataChange = (fieldName: keyof MedicationData, value: string | boolean) => {
    setExtractedData(prevData => {
      if (!prevData) return null;
      return { ...prevData, [fieldName]: value };
    });
  };

  const handleSaveChanges = () => {
    // This is a conceptual save. In a real app, this would send data to a backend.
    console.log("Saving changes:", extractedData);
    toast({
      title: "Changes Saved (Conceptual)",
      description: "Medication data changes have been logged.",
    });
  };

  return (
    <div className="space-y-8">
      <FaxUploadForm
        onFileSelect={handleFileSelect}
        onProcessFax={handleProcessFax}
        isProcessing={isProcessingFax}
        selectedFileName={selectedFile?.name || null}
      />

      {error && (
         <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
      )}

      <Separator />

      <div className="grid md:grid-cols-2 gap-8">
        <FaxDisplay faxImageUri={faxDataUri} />
        <ExtractedDataForm
          data={extractedData}
          onDataChange={handleDataChange}
          onSaveChanges={handleSaveChanges}
          isProcessingAi={isProcessingAi}
        />
      </div>
    </div>
  );
}
