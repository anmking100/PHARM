
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, ShieldCheck, CheckCircle, XCircle, Settings, ListChecks, FileInput, RefreshCw, HelpCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  checkAiFaxProcessingStatus,
  checkExternalApiIntegrationStatus,
  checkAutomatedFaxIntakeStatus,
} from './actions';
import { formatDistanceToNow } from 'date-fns';

export type AppStatusType = 'active' | 'inactive' | 'error' | 'active (mocked)' | 'pending';

interface BaseStatusItem {
  id: string;
  label: string;
  initialStatus: AppStatusType;
  description?: string;
  icon?: React.ElementType;
  checkAction: () => Promise<{ success: boolean; message: string; newStatus: AppStatusType }>;
}

interface DynamicStatusItem extends BaseStatusItem {
  currentApiStatus: AppStatusType;
  lastChecked?: Date;
  lastMessage?: string;
  isLoading: boolean;
}

const StatusIndicator: React.FC<DynamicStatusItem & { onCheck: () => void }> = ({
  label,
  currentApiStatus,
  description,
  icon,
  lastChecked,
  lastMessage,
  isLoading,
  onCheck
}) => {
  const getStatusDetails = (status: AppStatusType) => {
    switch (status) {
      case 'active':
      case 'active (mocked)':
        return { iconDisplay: icon || CheckCircle, color: 'text-green-500', text: status };
      case 'error':
        return { iconDisplay: icon || XCircle, color: 'text-red-500', text: status };
      case 'pending':
        return { iconDisplay: icon || HelpCircle, color: 'text-yellow-500', text: 'Pending Check' };
      case 'inactive':
      default:
        return { iconDisplay: icon || Settings, color: 'text-gray-500', text: status };
    }
  };

  const { iconDisplay: IconDisplay, color, text: statusText } = getStatusDetails(currentApiStatus);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b last:border-b-0 gap-3">
      <div className="flex items-center gap-3 flex-grow">
        <IconDisplay className={`h-6 w-6 ${color} flex-shrink-0`} />
        <div className="flex-grow">
          <p className="font-semibold text-base">{label}</p>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
          {lastMessage && (
            <p className={`text-xs mt-1 ${currentApiStatus === 'error' ? 'text-red-600' : 'text-muted-foreground'}`}>
              Result: {lastMessage}
            </p>
          )}
          {lastChecked && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" /> Last checked: {formatDistanceToNow(lastChecked, { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end sm:items-center gap-2 self-end sm:self-center flex-shrink-0">
         <span className={`text-sm font-semibold capitalize ${color} px-2 py-1 rounded-md ${color.replace('text-', 'bg-')}/10`}>{statusText}</span>
        <Button size="sm" variant="outline" onClick={onCheck} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Check Status
        </Button>
      </div>
    </div>
  );
};

export default function AppStatusPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const initialStatusItems: BaseStatusItem[] = [
    { 
      id: 'ai-fax',
      label: 'AI Fax Processing Service', 
      initialStatus: 'active', 
      description: 'Genkit flow for data extraction from faxes.',
      icon: FileInput,
      checkAction: checkAiFaxProcessingStatus,
    },
    { 
      id: 'external-api',
      label: 'External API Integrations', 
      initialStatus: 'active (mocked)', 
      description: 'Conceptual: Mock Drug Information API for fetching side effects.',
      icon: ListChecks,
      checkAction: checkExternalApiIntegrationStatus,
    },
    { 
      id: 'fax-intake',
      label: 'Automated Fax Intake', 
      initialStatus: 'error', 
      description: 'Conceptual - Fax polling service simulated as offline.',
      icon: FileInput, // Could use a different icon like ServerOff if available
      checkAction: checkAutomatedFaxIntakeStatus,
    },
  ];
  
  const [dynamicStatusItems, setDynamicStatusItems] = useState<DynamicStatusItem[]>(
    initialStatusItems.map(item => ({
      ...item,
      currentApiStatus: item.initialStatus, // Or 'pending' if you want to force a check
      isLoading: false,
    }))
  );

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.replace('/login?redirect=/app-status');
    }
  }, [user, isAdmin, authLoading, router]);

  const handleCheckStatus = useCallback(async (itemId: string) => {
    setDynamicStatusItems(prevItems =>
      prevItems.map(item => (item.id === itemId ? { ...item, isLoading: true } : item))
    );

    const itemToCheck = dynamicStatusItems.find(item => item.id === itemId);
    if (!itemToCheck) return;

    try {
      const result = await itemToCheck.checkAction();
      setDynamicStatusItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId
            ? {
                ...item,
                isLoading: false,
                currentApiStatus: result.newStatus,
                lastMessage: result.message,
                lastChecked: new Date(),
              }
            : item
        )
      );
      toast({
        title: `${itemToCheck.label} Status`,
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (error: any) {
      const errorMessage = error.message || 'An unknown error occurred during status check.';
      setDynamicStatusItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId
            ? {
                ...item,
                isLoading: false,
                currentApiStatus: 'error',
                lastMessage: errorMessage,
                lastChecked: new Date(),
              }
            : item
        )
      );
      toast({
        title: `${itemToCheck.label} Check Failed`,
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [dynamicStatusItems, toast]);


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

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Application Status
          </h1>
          <p className="text-muted-foreground">Overview of system components and their operational status. Click "Check Status" to probe services.</p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>System Health Dashboard</CardTitle>
          <CardDescription>
            This page provides an overview of key application services. Statuses can be manually refreshed.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {dynamicStatusItems.map((item) => (
              <StatusIndicator key={item.id} {...item} onCheck={() => handleCheckStatus(item.id)} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
