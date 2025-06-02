
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, ShieldCheck, CheckCircle, XCircle, Settings, DatabaseZap, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StatusItemProps {
  label: string;
  status: 'active' | 'inactive' | 'error' | 'active (mocked)';
  description?: string;
  icon?: React.ElementType;
}

const StatusIndicator: React.FC<StatusItemProps> = ({ label, status, description, icon }) => {
  const getStatusDetails = () => {
    switch (status) {
      case 'active':
      case 'active (mocked)':
        return { iconDisplay: icon || CheckCircle, color: 'text-green-500' };
      case 'error':
        return { iconDisplay: icon || XCircle, color: 'text-red-500' };
      case 'inactive':
      default:
        return { iconDisplay: icon || Settings, color: 'text-yellow-500' };
    }
  };

  const { iconDisplay: IconDisplay, color } = getStatusDetails();


  return (
    <div className="flex items-center justify-between p-3 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <IconDisplay className={`h-5 w-5 ${color}`} />
        <div>
          <p className="font-medium">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <span className={`text-sm font-semibold capitalize ${color}`}>{status}</span>
    </div>
  );
};

export default function AppStatusPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.replace('/login?redirect=/app-status');
    }
  }, [user, isAdmin, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading application status...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to view this page.
            <Button onClick={() => router.push('/login?redirect=/app-status')} className="mt-4 w-full">
              Go to Login
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Conceptual status items
  const statusItems: StatusItemProps[] = [
    { label: 'AI Fax Processing Service', status: 'active', description: 'Genkit flow for data extraction from faxes.' },
    { 
      label: 'External API Integrations', 
      status: 'active (mocked)', 
      description: 'Conceptual: Mock Drug Information API for fetching side effects. Currently returns hardcoded data.',
      icon: ListChecks // Changed icon to ListChecks
    },
    { label: 'Automated Fax Intake', status: 'error', description: 'Conceptual - Fax polling service simulated as offline.' },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Application Status
          </h1>
          <p className="text-muted-foreground">Overview of system components and their operational status.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>
            This page provides a conceptual overview of the status of different application features and pipelines.
            In a production environment, these statuses would be dynamically fetched from monitoring services.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {statusItems.map((item) => (
              <StatusIndicator key={item.label} {...item} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
