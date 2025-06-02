"use client";

import type { ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Edit, Save, AlertTriangle, Bot, CheckCircle2, Info, Loader2 } from "lucide-react";
import type { MedicationData } from "@/lib/types";

interface ExtractedDataFormProps {
  data: MedicationData | null;
  onDataChange: (fieldName: keyof MedicationData, value: string | boolean) => void;
  onSaveChanges: () => void;
  isProcessingAi: boolean;
}

export default function ExtractedDataForm({ data, onDataChange, onSaveChanges, isProcessingAi }: ExtractedDataFormProps) {
  
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
          <p className="text-muted-foreground">No data extracted yet. Upload and process a fax to see results here.</p>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Edit className="h-6 w-6 text-primary" />
          Extracted Medication Data
        </CardTitle>
        <CardDescription>Review and edit the data extracted by AI. Fields marked with an asterisk (*) may require attention.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.isHandwritten && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Handwritten Prescription Detected</AlertTitle>
            <AlertDescription>
              The AI has identified this prescription as potentially handwritten. Please review the extracted data carefully for accuracy.
            </AlertDescription>
          </Alert>
        )}
         {!data.isHandwritten && Object.values(data).some(val => val === "") && (
          <Alert variant="default" className="bg-accent/10 border-accent/50 text-accent-foreground">
            <Info className="h-4 w-4 text-accent" />
            <AlertTitle>Missing Information</AlertTitle>
            <AlertDescription>
              Some fields could not be extracted. Please review and complete the missing information.
            </AlertDescription>
          </Alert>
        )}


        <form className="space-y-4">
          {formFields.map(field => (
            <div key={field.id} className="grid gap-1.5">
              <Label htmlFor={field.id} className="font-medium">
                {field.label}
                {(data[field.id] === "" || (field.id === 'prescribingDoctor' && data.isHandwritten)) && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                id={field.id}
                name={field.id}
                type={field.type || "text"}
                value={data[field.id] as string}
                onChange={handleInputChange}
                placeholder={field.placeholder}
                className={data[field.id] === "" ? "border-destructive ring-destructive focus-visible:ring-destructive" : ""}
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
              />
            <Label htmlFor="isHandwritten" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Is Handwritten?
            </Label>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button onClick={onSaveChanges} className="w-full sm:w-auto ml-auto" variant="default">
          <Save className="mr-2 h-4 w-4" />
          Save Changes (Conceptual)
        </Button>
      </CardFooter>
    </Card>
  );
}
