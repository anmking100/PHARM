
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Users, AlertTriangle, Info, Clock } from 'lucide-react';
import type { MedicationData, MedicationStatus } from '@/lib/types';
import { getAllPatientRecords } from '@/lib/patient-data';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const statusDisplay: Record<MedicationStatus, string> = {
  pending_extraction: "Pending Extraction",
  pending_review: "Pending Review",
  reviewed: "Reviewed",
  packed: "Packed",
};

const getStatusBadgeVariant = (status?: MedicationStatus) => {
  switch (status) {
    case 'pending_review': return 'destructive';
    case 'reviewed': return 'secondary';
    case 'packed': return 'default'; 
    default: return 'outline';
  }
};

export default function PatientsPage() {
  const { user, loading: authLoading, isAdmin, isPharmacist } = useAuth();
  const router = useRouter();
  const [patientRecords, setPatientRecords] = useState<MedicationData[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);

  const canViewPage = isAdmin || isPharmacist;

  useEffect(() => {
    if (!authLoading) {
      if (!user || !canViewPage) {
        router.replace('/login?redirect=/patients');
      } else {
        const records = getAllPatientRecords();
        // For this page, let's only show records that have been at least reviewed or packed.
        setPatientRecords(records.filter(r => r.status === 'reviewed' || r.status === 'packed')
                                  .sort((a, b) => {
                                    // Sort by parsedAt descending (newest first)
                                    const dateA = a.parsedAt ? new Date(a.parsedAt).getTime() : 0;
                                    const dateB = b.parsedAt ? new Date(b.parsedAt).getTime() : 0;
                                    return dateB - dateA;
                                  }));
        setIsLoadingRecords(false);
      }
    }
  }, [user, authLoading, isAdmin, isPharmacist, router, canViewPage]);

  if (authLoading || isLoadingRecords) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading patient data...</p>
      </div>
    );
  }

  if (!user || !canViewPage) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <Alert variant="destructive" className="max-w-md">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                    You do not have permission to view this page.
                    <Button onClick={() => router.push('/login?redirect=/patients')} className="mt-4 w-full">
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
            <Users className="h-8 w-8 text-primary" />
            Patient Records
          </h1>
          <p className="text-muted-foreground">
            View all reviewed and packed prescription records. Sorted by most recently parsed.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prescription List</CardTitle>
          <CardDescription>
            The table below shows medication records that have been reviewed or packed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {patientRecords.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No Records Found</AlertTitle>
              <AlertDescription>
                There are no patient records that have been marked as 'reviewed' or 'packed' yet. 
                Process and save prescriptions on the home page to populate this list.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  {/* <TableHead>Frequency</TableHead> */}
                  {/* <TableHead>Prescribing Doctor</TableHead> */}
                  <TableHead className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Parsed At
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patientRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.patientName || 'N/A'}</TableCell>
                    <TableCell>{record.medicationName || 'N/A'}</TableCell>
                    <TableCell>{record.dosage || 'N/A'}</TableCell>
                    {/* <TableCell>{record.frequency || 'N/A'}</TableCell> */}
                    {/* <TableCell>{record.prescribingDoctor || 'N/A'}</TableCell> */}
                    <TableCell>
                      {record.parsedAt ? format(new Date(record.parsedAt), "yyyy-MM-dd HH:mm") : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {record.status && (
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {statusDisplay[record.status] || 'Unknown'}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
