"use client";

import type { ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, Loader2 } from "lucide-react";

interface FaxUploadFormProps {
  onFileSelect: (file: File | null) => void;
  onProcessFax: () => void;
  isProcessing: boolean;
  selectedFileName: string | null;
}

export default function FaxUploadForm({ 
  onFileSelect, 
  onProcessFax, 
  isProcessing,
  selectedFileName 
}: FaxUploadFormProps) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onFileSelect(file || null);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="fax-upload" className="text-lg font-medium">Upload Fax Document</Label>
        <p className="text-sm text-muted-foreground">Select an image file (e.g., PNG, JPG) representing the fax.</p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Input id="fax-upload" type="file" accept="image/png, image/jpeg, image/gif" onChange={handleFileChange} className="file:text-primary file:font-medium"/>
        </div>
        <Button onClick={onProcessFax} disabled={isProcessing || !selectedFileName} className="w-full sm:w-auto">
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="mr-2 h-4 w-4" />
          )}
          Process Fax
        </Button>
      </div>
      {selectedFileName && (
        <p className="text-sm text-muted-foreground">Selected file: {selectedFileName}</p>
      )}
    </div>
  );
}
