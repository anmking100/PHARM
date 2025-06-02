
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [faxDataUri, setFaxDataUri] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<MedicationData | null>(null);
  const [isProcessingFax, setIsProcessingFax] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const canAccessPage = isAdmin || isPharmacist;
  const canUploadAndEdit = isAdmin || isPharmacist;

  const performRedirect = useCallback(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?redirect=/');
      } else if (isTechnician) { // Technicians should not access this page
        router.replace('/patients');
      }
    }
  }, [authLoading, user, isTechnician, router]);

  useEffect(() => {
    performRedirect();
  }, [performRedirect]);


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
      let userFriendlyMessage = "An unknown error occurred during AI processing.";
      let toastTitle = "AI Processing Error";

      if (e.message && typeof e.message === 'string') {
        const lowerCaseMessage = e.message.toLowerCase();
        if (lowerCaseMessage.includes("503") || lowerCaseMessage.includes("overloaded") || lowerCaseMessage.includes("service unavailable")) {
          toastTitle = "AI Service Overloaded";
          userFriendlyMessage = "The AI model is currently overloaded or unavailable. Please try again in a few moments.";
        } else {
          userFriendlyMessage = "Could not extract data from fax. Please check the console for details or try again.";
           if (!lowerCaseMessage.includes("fetch")) {
             userFriendlyMessage = e.message;
           }
        }
      }

      setError(`Failed to process fax: ${userFriendlyMessage}`);
      setExtractedData(null);
      toast({
        variant: "destructive",
        title: toastTitle,
        description: userFriendlyMessage,
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
    // Admin can edit even if packed, others cannot
    if (extractedData?.status === 'packed' && !isAdmin) {
        toast({variant: "destructive", title: "Action Not Allowed", description: "Packed prescriptions cannot be modified by your role."});
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

    // If Admin is saving a "packed" record, it becomes "reviewed"
    // Otherwise, saving sets status to "reviewed" (or keeps it if already "approved" etc.)
    let newStatus: MedicationStatus = 'reviewed';
    if (isAdmin && extractedData.status === 'packed') {
        newStatus = 'reviewed';
    } else if (extractedData.status && ['approved', 'packed'].includes(extractedData.status) && !isAdmin) {
        // Non-admins cannot change an approved or packed status back to reviewed via save
        newStatus = extractedData.status;
    } else if (extractedData.status) {
        newStatus = extractedData.status === 'pending_extraction' || extractedData.status === 'pending_review' ? 'reviewed' : extractedData.status;
    }


    const dataToSave = { ...extractedData, status: newStatus };
    const savedData = upsertPatientRecord(dataToSave);
    setExtractedData(savedData);

    console.log("Saving changes and upserting to patient records:", savedData);
    toast({
      title: "Changes Saved",
      description: `Medication data saved. Status: ${statusDisplay[newStatus]}. View in Patients page.`,
    });
  };

  const handleMarkAsPacked = () => {
    // Admin or Pharmacist can pack if status is pending_review, reviewed, or approved.
    const canRolePack = isAdmin || isPharmacist;
    
    if (!canRolePack) {
      toast({variant: "destructive", title: "Permission Denied", description: "You do not have sufficient permissions to mark as packed."});
      return;
    }
    if (!extractedData) return;

    if (extractedData.status === 'packed' && !isAdmin) {
        toast({variant: "destructive", title: "Already Packed", description: "This prescription is already packed."});
        return;
    }
    
    // Admins/Pharmacists can pack from 'pending_review', 'reviewed', 'approved'
    if (!['pending_review', 'reviewed', 'approved'].includes(extractedData.status as string) && extractedData.status !== 'packed') {
         toast({variant: "destructive", title: "Action Not Allowed", description: "Prescription must be pending review, reviewed, or approved to be packed."});
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
  
  const statusDisplay: Record<MedicationStatus, string> = {
    pending_extraction: "Pending Extraction",
    pending_review: "Pending Review",
    reviewed: "Reviewed",
    approved: "Approved",
    packed: "Packed",
  };


  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  if ((!user && !authLoading) || (user && !canAccessPage)) { 
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
         <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
                {user && !canAccessPage ? "You do not have permission to view this page." : "Please log in to access this page."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(user && !canAccessPage ? (isTechnician ? '/patients' : '/login') : '/login?redirect=/')} className="w-full">
                {user && !canAccessPage ? (isTechnician ? 'Go to Patients Page' : 'Go to Login') : 'Go to Login'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="flex flex-grow h-full">
      <div className="w-full bg-background text-foreground p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold border-b border-border pb-2 text-foreground">RxFlow Assist</h2>
          <p className="text-muted-foreground mt-2">
            Streamline your pharmacy operations with AI-powered fax processing.
            This system helps extract critical medication information from faxes,
            reducing manual data entry and potential errors.
          </p>
        </div>
        <div className="space-y-6">
          {canUploadAndEdit && (
            <FaxUploadForm
              onFileSelect={handleFileSelect}
              onProcessFax={handleProcessFax}
              isProcessing={isProcessingFax}
              selectedFileName={selectedFile?.name || null}
            />
          )}
          
          {error && (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}

          <Separator />

          <div className="space-y-6">
            <FaxDisplay faxImageUri={faxDataUri} />
            <ExtractedDataForm
              data={extractedData}
              onDataChange={handleDataChange}
              onSaveChanges={handleSaveChanges}
              onMarkAsPacked={handleMarkAsPacked}
              isProcessingAi={isProcessingAi}
              canEdit={canUploadAndEdit} 
              canPack={canUploadAndEdit} // For this page, Admin/Pharmacist can pack
              currentStatus={extractedData?.status}
              isAdmin={isAdmin} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const statusDisplay: Record<MedicationStatus, string> = {
  pending_extraction: "Pending Extraction",
  pending_review: "Pending Review",
  reviewed: "Reviewed",
  approved: "Approved",
  packed: "Packed",
};

