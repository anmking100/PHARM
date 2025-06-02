
"use client";

import { useState, useEffect } from 'react';
import FaxUploadForm from '@/components/medication/FaxUploadForm';
import FaxDisplay from '@/components/medication/FaxDisplay';
import ExtractedDataForm from '@/components/medication/ExtractedDataForm';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { extractMedicationData } from '@/ai/flows/extract-medication-data';
import type { MedicationData, MedicationStatus } from '@/lib/types';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function HomePage() {
  const { user, isPharmacist, isTechnician, isAdmin, loading: authLoading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [faxDataUri, setFaxDataUri] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<MedicationData | null>(null);
  const [isProcessingFax, setIsProcessingFax] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const canUploadAndEdit = isPharmacist || isAdmin;
  const canMarkAsPacked = isTechnician;

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File | null) => {
    if (!canUploadAndEdit) {
      toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to upload faxes."});
      return;
    }
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
    if (!canUploadAndEdit) {
      toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to process faxes."});
      return;
    }
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
      setExtractedData({...result, status: result.status || 'pending_review'});
      toast({
        title: "Processing Complete",
        description: "Fax data extracted successfully. Status: Pending Review.",
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

  const handleDataChange = (fieldName: keyof MedicationData, value: string | boolean | MedicationStatus) => {
    if (!canUploadAndEdit) { // Technicians cannot edit fields directly through this
        toast({variant: "destructive", title: "Permission Denied", description: "You cannot edit prescription details."});
        return;
    }
    setExtractedData(prevData => {
      if (!prevData) return null;
      return { ...prevData, [fieldName]: value };
    });
  };

  const handleSaveChanges = () => {
    if (!canUploadAndEdit) {
       toast({variant: "destructive", title: "Permission Denied", description: "You cannot save prescription changes."});
      return;
    }
    if (!extractedData) return;

    // Conceptual save: update status to 'reviewed'
    const updatedData = { ...extractedData, status: 'reviewed' as MedicationStatus };
    setExtractedData(updatedData);
    console.log("Saving changes (conceptual):", updatedData);
    toast({
      title: "Changes Saved (Conceptual)",
      description: "Medication data changes logged. Status: Reviewed.",
    });
  };
  
  const handleMarkAsPacked = () => {
    if (!canMarkAsPacked) {
      toast({variant: "destructive", title: "Permission Denied", description: "Only technicians can mark prescriptions as packed."});
      return;
    }
    if (!extractedData) return;

    // Conceptual update: change status to 'packed'
    const updatedData = { ...extractedData, status: 'packed' as MedicationStatus };
    setExtractedData(updatedData);
    console.log("Marked as packed (conceptual):", updatedData);
    toast({
      title: "Marked as Packed (Conceptual)",
      description: "Prescription status updated to Packed.",
    });
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  if (!user) {
    // This should ideally redirect to login if not handled by a higher-level route guard
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
         <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/login'} className="w-full">Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      {canUploadAndEdit && (
        <FaxUploadForm
          onFileSelect={handleFileSelect}
          onProcessFax={handleProcessFax}
          isProcessing={isProcessingFax}
          selectedFileName={selectedFile?.name || null}
        />
      )}
      {!canUploadAndEdit && isTechnician && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Technician View</AlertTitle>
          <AlertDescription>
            You are in technician view. You can view prescription details and mark them as packed. 
            Fax upload and editing are restricted.
          </AlertDescription>
        </Alert>
      )}


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
          onMarkAsPacked={handleMarkAsPacked}
          isProcessingAi={isProcessingAi}
          canEdit={canUploadAndEdit}
          canPack={canMarkAsPacked}
          currentStatus={extractedData?.status}
        />
      </div>
    </div>
  );
}
