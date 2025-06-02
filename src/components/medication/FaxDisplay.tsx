import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface FaxDisplayProps {
  faxImageUri: string | null;
}

export default function FaxDisplay({ faxImageUri }: FaxDisplayProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-6 w-6 text-primary" />
          Original Fax Document
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-[3/4] w-full bg-muted rounded-md flex items-center justify-center overflow-hidden border border-dashed">
          {faxImageUri ? (
            <Image
              src={faxImageUri}
              alt="Uploaded Fax"
              width={600}
              height={800}
              className="object-contain w-full h-full"
              data-ai-hint="fax document"
            />
          ) : (
            <div className="text-center text-muted-foreground p-4">
              <FileText className="h-16 w-16 mx-auto mb-2" />
              <p>Upload a fax document to see a preview here.</p>
              <p className="text-xs mt-2">Default Placeholder:</p>
               <Image src="https://placehold.co/600x800.png" alt="Fax placeholder" width={150} height={200} className="mx-auto mt-1 opacity-50" data-ai-hint="fax document" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
