
"use client";

import type { ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Edit, Save, AlertTriangle, Bot, CheckCircle2, Info, Loader2, PackageCheck, ClipboardList } from "lucide-react";
import type { MedicationData, MedicationStatus } from "@/lib/types";
import { Badge } from '@/components/ui/badge';

interface ExtractedDataFormProps {
  data: MedicationData | null;
  onDataChange: (fieldName: keyof MedicationData, value: string | boolean | MedicationStatus) => void;
  onSaveChanges: () => void;
  onMarkAsPacked: () => void;
  isProcessingAi: boolean;
  canEdit: boolean;
  canPack: boolean;
  currentStatus?: MedicationStatus;
  isTechnicianView?: boolean; // Added to refine messages for technicians
}

const statusDisplay: Record<MedicationStatus, string> = {
  pending_extraction: "Pending Extraction",
  pending_review: "Pending Review",
  reviewed: "Reviewed",
  packed: "Packed",
};

export default function ExtractedDataForm({ 
  data, 
  onDataChange, 
  onSaveChanges, 
  onMarkAsPacked,
  isProcessingAi,
  canEdit,
  canPack,
  currentStatus,
  isTechnicianView
}: ExtractedDataFormProps) {
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    onDataChange(name as keyof MedicationData, type === 'checkbox' ? checked : value);
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

  const formFields: Array<{ id: keyof MedicationData; label: string; type?: string, placeholder?: string }> = [
    { id: "patientName", label: "Patient Name", placeholder: "e.g., John Doe" },
    { id: "medicationName", label: "Medication Name", placeholder: "e.g., Amoxicillin" },
    { id: "dosage", label: "Dosage", placeholder: "e.g., 250mg" },
    { id: "frequency", label: "Frequency", placeholder: "e.g., Twice a day" },
    { id: "prescribingDoctor", label: "Prescribing Doctor", placeholder: "e.g., Dr. Smith" },
  ];

  const getStatusBadgeVariant = (status?: MedicationStatus) => {
    switch (status) {
      case 'pending_review': return 'destructive';
      case 'reviewed': return 'secondary';
      case 'packed': return 'default'; // primary color
      default: return 'outline';
    }
  };

  const isSaveDisabled = currentStatus === 'packed' || currentStatus === 'reviewed';
  // Technicians can only pack if status is 'reviewed'. Admins/Pharmacists have more freedom for testing.
  const isPackDisabled = currentStatus === 'packed' || (isTechnicianView && currentStatus !== 'reviewed');


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2 text-xl">
            {canEdit ? <Edit className="h-6 w-6 text-primary" /> : <ClipboardList className="h-6 w-6 text-primary" />}
            Extracted Medication Data
          </CardTitle>
          {currentStatus && (
             <Badge variant={getStatusBadgeVariant(currentStatus)} className="text-sm">
                {statusDisplay[currentStatus] || "Unknown Status"}
            </Badge>
          )}
        </div>
        <CardDescription>
          {canEdit ? "Review and edit the data extracted by AI. Fields marked with an asterisk (*) may require attention." : "View extracted prescription details."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.isHandwritten && (
          <Alert variant={canEdit ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Handwritten Prescription Detected</AlertTitle>
            <AlertDescription>
              The AI has identified this prescription as potentially handwritten. Please review the extracted data carefully for accuracy.
            </AlertDescription>
          </Alert>
        )}
         {!data.isHandwritten && Object.entries(data).some(([key, val]) => key !== 'id' && key !== 'isHandwritten' && key !== 'status' && val === "" && typeof val === 'string') && (
          <Alert variant="default" className="bg-accent/10 border-accent/50 text-accent-foreground">
            <Info className="h-4 w-4 text-accent" />
            <AlertTitle>Missing Information</AlertTitle>
            <AlertDescription>
              Some fields could not be extracted. {canEdit ? "Please review and complete the missing information." : "Awaiting review."}
            </AlertDescription>
          </Alert>
        )}

        <form className="space-y-4">
          {formFields.map(field => (
            <div key={field.id} className="grid gap-1.5">
              <Label htmlFor={field.id} className="font-medium">
                {field.label}
                {canEdit && (data[field.id] === "" || (field.id === 'prescribingDoctor' && data.isHandwritten)) && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                id={field.id}
                name={field.id}
                type={field.type || "text"}
                value={data[field.id] as string}
                onChange={handleInputChange}
                placeholder={field.placeholder}
                readOnly={!canEdit}
                className={(canEdit && data[field.id] === "") ? "border-destructive ring-destructive focus-visible:ring-destructive" : ""}
              />
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
                disabled={!canEdit}
              />
            <Label htmlFor="isHandwritten" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Is Handwritten?
            </Label>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {canEdit && (
          <Button onClick={onSaveChanges} variant="default" disabled={isSaveDisabled}>
            <Save className="mr-2 h-4 w-4" />
            {currentStatus === 'packed' ? 'Prescription Packed' : (currentStatus === 'reviewed' ? 'Already Reviewed' : 'Save Changes & Mark Reviewed')}
          </Button>
        )}
        {canPack && (
          <Button onClick={onMarkAsPacked} variant="default" disabled={isPackDisabled}>
            <PackageCheck className="mr-2 h-4 w-4" />
            {currentStatus === 'packed' ? 'Already Packed' : 'Mark as Packed'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
