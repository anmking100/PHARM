
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
import { Button } from '@/components/ui/button';
import { upsertPatientRecord } from '@/lib/patient-data';


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
      // AI result comes without an ID. ID is assigned upon first save.
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
    if (!canUploadAndEdit) { 
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

    const dataToSave = { ...extractedData, status: 'reviewed' as MedicationStatus };
    const savedData = upsertPatientRecord(dataToSave); 
    setExtractedData(savedData); // Update state with potentially new ID and status
    
    console.log("Saving changes and upserting to patient records:", savedData);
    toast({
      title: "Changes Saved",
      description: "Medication data saved and marked as reviewed. View in Patients page.",
    });
  };
  
  const handleMarkAsPacked = () => {
    if (!canMarkAsPacked && !(isAdmin || isPharmacist)) { // Allow admin/pharmacist to also pack for testing
      toast({variant: "destructive", title: "Permission Denied", description: "You do not have sufficient permissions to mark as packed."});
      return;
    }
    if (!extractedData) return;
     // Technicians can only mark as packed if it's already reviewed.
    if (isTechnician && extractedData.status !== 'reviewed') {
      toast({variant: "destructive", title: "Action Not Allowed", description: "Prescription must be reviewed by a pharmacist before it can be packed."});
      return;
    }


    const dataToUpdate = { ...extractedData, status: 'packed' as MedicationStatus };
    const updatedData = upsertPatientRecord(dataToUpdate);
    setExtractedData(updatedData); 

    console.log("Marked as packed and upserted to patient records:", updatedData);
    toast({
      title: "Marked as Packed",
      description: "Prescription status updated to Packed and saved.",
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
    <div className="flex flex-grow h-full"> {/* Main flex container for two panels */}
      {/* Left Panel - 40% black */}
      <div className="w-2/5 bg-black text-white p-6 flex flex-col space-y-4">
        <h2 className="text-3xl font-semibold border-b border-gray-700 pb-2">RxFlow Assist</h2>
        <p className="text-gray-300">
          Streamline your pharmacy operations with AI-powered fax processing. 
          This system helps extract critical medication information from faxes,
          reducing manual data entry and potential errors.
        </p>
        <div className="mt-auto pt-4">
            <p className="text-xs text-gray-500">Version 1.0.0</p>
            <p className="text-xs text-gray-500">&copy; 2024 Your Pharmacy Solutions</p>
        </div>
      </div>

      {/* Right Panel - 60% white - existing content goes here */}
      <div className="w-3/5 bg-background text-foreground p-6 overflow-y-auto">
        <div className="space-y-6"> {/* Adjusted spacing for content within the panel */}
          {canUploadAndEdit && (
            <FaxUploadForm
              onFileSelect={handleFileSelect}
              onProcessFax={handleProcessFax}
              isProcessing={isProcessingFax}
              selectedFileName={selectedFile?.name || null}
            />
          )}
          {!canUploadAndEdit && (isTechnician || !(isAdmin || isPharmacist)) && ( // Show if technician or if not admin/pharmacist
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Restricted View</AlertTitle>
              <AlertDescription>
                {isTechnician ? "You are in technician view. You can view prescription details and mark them as packed once reviewed by a pharmacist." : "You do not have permission to upload or edit faxes."}
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

          {/* Changed to single column layout for FaxDisplay and ExtractedDataForm */}
          <div className="space-y-6">
            <FaxDisplay faxImageUri={faxDataUri} />
            <ExtractedDataForm
              data={extractedData}
              onDataChange={handleDataChange}
              onSaveChanges={handleSaveChanges}
              onMarkAsPacked={handleMarkAsPacked}
              isProcessingAi={isProcessingAi}
              canEdit={canUploadAndEdit}
              canPack={canMarkAsPacked || isAdmin || isPharmacist} // Admins/Pharmacists can also pack for testing
              currentStatus={extractedData?.status}
              isTechnicianView={isTechnician}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
