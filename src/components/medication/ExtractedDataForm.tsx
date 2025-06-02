
"use client";

import React, { type ChangeEvent, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Edit, Save, AlertTriangle, Bot, CheckCircle2, Info, Loader2, PackageCheck, ClipboardList, Clock, Pill, ListChecks } from "lucide-react";
import type { MedicationData, MedicationStatus, ExtractedDataFormProps } from "@/lib/types";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { getDrugInfo, type GetDrugInfoOutput } from '@/ai/flows/get-drug-info-flow';
import { useToast } from '@/hooks/use-toast';


const statusDisplayRecord: Record<MedicationStatus, string> = {
  pending_extraction: "Pending Extraction",
  pending_review: "Pending Review",
  reviewed: "Reviewed",
  approved: "Approved", 
  packed: "Packed",
};

export default function ExtractedDataForm({
  data,
  onDataChange,
  onSaveChanges,
  onMarkAsPacked,
  isProcessingAi,
  canEdit, // True for Admin/Pharmacist on home page
  canPack, // True for Admin/Pharmacist on home page
  currentStatus,
  isAdmin, // Crucial for override logic
  // isTechnicianView is removed as this form is not directly used by technicians this way
}: ExtractedDataFormProps) {
  const { toast } = useToast();
  const [isFetchingSideEffects, setIsFetchingSideEffects] = useState(false);
  const [sideEffectsData, setSideEffectsData] = useState<GetDrugInfoOutput | null>(null);
  const [sideEffectsError, setSideEffectsError] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Prevent edit if packed and not admin
    if (currentStatus === 'packed' && !isAdmin) {
        toast({ variant: "destructive", title: "Action Not Allowed", description: "Packed prescriptions cannot be modified." });
        return;
    }
    onDataChange(name as keyof MedicationData, type === 'checkbox' ? checked : value);
     if (name === "medicationName") {
      setSideEffectsData(null);
      setSideEffectsError(null);
    }
  };

  const handleFetchSideEffects = async () => {
    if (!data?.medicationName) return;
    
    // Allow admin to fetch side effects even if packed. Others cannot if packed.
    if (currentStatus === 'packed' && !isAdmin) {
         toast({ variant: "destructive", title: "Action Not Allowed", description: "Cannot fetch side effects for a packed prescription." });
        return;
    }
    // Also ensure user fundamentally has edit rights for this component context
    if (!canEdit && !isAdmin) return;


    setIsFetchingSideEffects(true);
    setSideEffectsData(null);
    setSideEffectsError(null);

    try {
      const result = await getDrugInfo({ medicationName: data.medicationName });
      setSideEffectsData(result);
      if (result.sideEffects.includes('No side effect information available')) {
         toast({ variant: "default", title: "Drug Info", description: "No specific side effects found in mock data." });
      } else {
         toast({ title: "Drug Info", description: `Side effects for ${data.medicationName} fetched.` });
      }
    } catch (error: any) {
      console.error("Error fetching side effects:", error);
      const errorMessage = error.message || "Failed to fetch side effects.";
      setSideEffectsError(errorMessage);
      toast({ variant: "destructive", title: "Drug Info Error", description: errorMessage });
    } finally {
      setIsFetchingSideEffects(false);
    }
  };


  if (isProcessingAi) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Bot className="h-6 w-6 text-primary animate-pulse" />
            Extracted Medication Data
          </CardTitle>
          <CardDescription>AI is processing the fax. Please wait...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="ml-4 text-muted-foreground">Extracting data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
             <Info className="h-6 w-6 text-primary" />
            Extracted Medication Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No data extracted yet. {canEdit ? "Upload and process a fax" : "Awaiting fax processing"} to see results here.</p>
        </CardContent>
      </Card>
    );
  }

  const formFields: Array<{ id: keyof MedicationData; label: string; type?: string, placeholder?: string, hasSideEffectButton?: boolean }> = [
    { id: "patientName", label: "Patient Name", placeholder: "e.g., John Doe" },
    { id: "medicationName", label: "Medication Name", placeholder: "e.g., Amoxicillin", hasSideEffectButton: true },
    { id: "dosage", label: "Dosage", placeholder: "e.g., 250mg" },
    { id: "frequency", label: "Frequency", placeholder: "e.g., Twice a day" },
    { id: "prescribingDoctor", label: "Prescribing Doctor", placeholder: "e.g., Dr. Smith" },
  ];

  const getStatusBadgeVariant = (status?: MedicationStatus) => {
    switch (status) {
      case 'pending_review': return 'destructive';
      case 'reviewed': return 'secondary';
      case 'approved': return 'default';
      case 'packed': return 'default';
      default: return 'outline';
    }
  };
  
  const isEffectivelyDisabled = currentStatus === 'packed' && !isAdmin; // Form is disabled if packed UNLESS user is admin
  const isFormFieldsDisabled = !canEdit || isEffectivelyDisabled; // General editability + admin override for packed

  const saveButtonDisabled = 
    (!canEdit && !isAdmin) || // User fundamentally cannot edit (and isn't admin)
    (currentStatus === 'packed' && !isAdmin); // Non-admin cannot save if packed

  const packButtonDisabled =
    (!canPack && !isAdmin) || // User fundamentally cannot pack (and isn't admin)
    (currentStatus === 'packed' && !isAdmin); // Non-admin cannot pack if already packed


  const formattedParsedAt = data.parsedAt ? format(new Date(data.parsedAt), "PPpp") : 'N/A';

  let saveButtonText = "Save Changes & Mark Reviewed";
  if (isAdmin && currentStatus === 'packed') {
    saveButtonText = "Re-Open for Review";
  } else if (currentStatus === 'reviewed' || currentStatus === 'approved') {
    saveButtonText = 'Save Changes'; // Allow saving minor edits even if reviewed/approved
  } else if (currentStatus === 'packed' && !isAdmin) {
     saveButtonText = 'Prescription Packed';
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2 text-xl">
            {(canEdit || isAdmin) && !isEffectivelyDisabled ? <Edit className="h-6 w-6 text-primary" /> : <ClipboardList className="h-6 w-6 text-primary" />}
            Extracted Medication Data
          </CardTitle>
          {currentStatus && (
             <Badge variant={getStatusBadgeVariant(currentStatus)} className="text-sm">
                {statusDisplayRecord[currentStatus] || "Unknown Status"}
            </Badge>
          )}
        </div>
        <CardDescription>
          {isEffectivelyDisabled
            ? "This prescription is packed. Only an Admin can modify it further."
            : ((canEdit || isAdmin) ? "Review and edit the data extracted by AI. Fields marked with an asterisk (*) may require attention." : "View extracted prescription details.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.isHandwritten && !isEffectivelyDisabled && (
          <Alert variant={(canEdit || isAdmin) ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Handwritten Prescription Detected</AlertTitle>
            <AlertDescription>
              The AI has identified this prescription as potentially handwritten. Please review the extracted data carefully for accuracy.
            </AlertDescription>
          </Alert>
        )}
         {!data.isHandwritten && Object.entries(data).some(([key, val]) => key !== 'id' && key !== 'isHandwritten' && key !== 'status' && key !== 'parsedAt' && val === "" && typeof val === 'string') && !isEffectivelyDisabled && (
          <Alert variant="default" className="bg-accent/10 border-accent/50 text-accent-foreground">
            <Info className="h-4 w-4 text-accent" />
            <AlertTitle>Missing Information</AlertTitle>
            <AlertDescription>
              Some fields could not be extracted. {(canEdit || isAdmin) ? "Please review and complete the missing information." : "Awaiting review."}
            </AlertDescription>
          </Alert>
        )}

        <form className="space-y-4">
          {formFields.map(field => (
            <div key={field.id}>
              <div className="grid gap-1.5">
                <Label htmlFor={field.id} className="font-medium">
                  {field.label}
                  {(canEdit || isAdmin) && !isEffectivelyDisabled && (data[field.id] === "" || (field.id === 'prescribingDoctor' && data.isHandwritten)) && <span className="text-destructive ml-1">*</span>}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={field.id}
                    name={field.id}
                    type={field.type || "text"}
                    value={data[field.id] as string}
                    onChange={handleInputChange}
                    placeholder={field.placeholder}
                    disabled={isFormFieldsDisabled}
                    className={`flex-grow ${(!isEffectivelyDisabled && (canEdit || isAdmin) && data[field.id] === "") ? "border-destructive ring-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  {field.hasSideEffectButton && (canEdit || isAdmin) && !isEffectivelyDisabled && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleFetchSideEffects}
                      disabled={isFetchingSideEffects || !data?.medicationName || (currentStatus === 'packed' && !isAdmin)}
                      aria-label="Fetch side effects"
                    >
                      {isFetchingSideEffects ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pill className="h-4 w-4" />}
                      <span className="ml-2 hidden sm:inline">Side Effects</span>
                    </Button>
                  )}
                </div>
              </div>
              {field.id === "medicationName" && (isFetchingSideEffects || sideEffectsData || sideEffectsError) && !isEffectivelyDisabled && (
                <div className="mt-2">
                  {isFetchingSideEffects && (
                    <Alert variant="default" className="bg-muted/50">
                      <Loader2 className="h-4 w-4 animate-spin"/>
                      <AlertTitle>Loading Side Effects...</AlertTitle>
                      <AlertDescription>Fetching information for {data.medicationName}.</AlertDescription>
                    </Alert>
                  )}
                  {sideEffectsError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error Fetching Side Effects</AlertTitle>
                      <AlertDescription>{sideEffectsError}</AlertDescription>
                    </Alert>
                  )}
                  {sideEffectsData && !isFetchingSideEffects && (
                    <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700">
                       <ListChecks className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle className="text-blue-700 dark:text-blue-300">
                        Common Side Effects for {data.medicationName || 'this medication'}:
                      </AlertTitle>
                      <AlertDescription>
                        {sideEffectsData.sideEffects.length > 0 && !sideEffectsData.sideEffects.includes('No side effect information available') ? (
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {sideEffectsData.sideEffects.map((effect, index) => (
                              <li key={index}>{effect}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">{sideEffectsData.sideEffects[0] || 'No information found.'}</p>
                        )}
                         <p className="text-xs text-muted-foreground mt-2">(Mock data. Not for clinical use.)</p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center space-x-2 pt-2">
            <Input
                id="isHandwritten"
                name="isHandwritten"
                type="checkbox"
                checked={data.isHandwritten}
                onChange={handleInputChange}
                className="h-4 w-4 accent-primary"
                disabled={isFormFieldsDisabled}
              />
            <Label htmlFor="isHandwritten" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Is Handwritten?
            </Label>
          </div>
           {data.parsedAt && (
            <div className="grid gap-1.5 pt-2">
              <Label className="font-medium flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                Parsed At
              </Label>
              <Input
                type="text"
                value={formattedParsedAt}
                readOnly
                className="text-sm text-muted-foreground bg-muted/50"
              />
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {(canEdit || isAdmin) && (
          <Button onClick={onSaveChanges} variant="default" disabled={saveButtonDisabled}>
            <Save className="mr-2 h-4 w-4" />
            {saveButtonText}
          </Button>
        )}
        {(canPack || isAdmin) && (
          <Button onClick={onMarkAsPacked} variant="default" disabled={packButtonDisabled}>
            <PackageCheck className="mr-2 h-4 w-4" />
            {currentStatus === 'packed' ? (isAdmin ? 'Re-Pack' : 'Already Packed') : 'Mark as Packed'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

