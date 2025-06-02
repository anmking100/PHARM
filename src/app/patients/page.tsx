
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Users, AlertTriangle, Info, Clock, ChevronDown, ChevronUp } from 'lucide-react';
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

interface GroupedPatientData {
  patientName: string;
  records: MedicationData[]; // All records for this patient, sorted descending by date
}

export default function PatientsPage() {
  const { user, loading: authLoading, isAdmin, isPharmacist } = useAuth();
  const router = useRouter();
  const [groupedPatientData, setGroupedPatientData] = useState<GroupedPatientData[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());

  const canViewPage = isAdmin || isPharmacist;

  useEffect(() => {
    if (!authLoading) {
      if (!user || !canViewPage) {
        router.replace('/login?redirect=/patients');
      } else {
        const allRecords = getAllPatientRecords();
        const relevantRecords = allRecords.filter(r => r.status === 'reviewed' || r.status === 'packed');

        const groupedByName = relevantRecords.reduce<Record<string, MedicationData[]>>((acc, record) => {
          const name = record.patientName || 'Unknown Patient';
          if (!acc[name]) {
            acc[name] = [];
          }
          acc[name].push(record);
          return acc;
        }, {});

        const processedData = Object.entries(groupedByName).map(([name, recordsList]) => {
          const sortedRecords = recordsList.sort((a, b) => {
            const dateA = a.parsedAt ? new Date(a.parsedAt).getTime() : 0;
            const dateB = b.parsedAt ? new Date(b.parsedAt).getTime() : 0;
            return dateB - dateA; // Sort descending, newest first
          });
          return {
            patientName: name,
            records: sortedRecords,
          };
        });
        
        // Sort patients alphabetically by name for consistent order in the main list
        processedData.sort((a,b) => a.patientName.localeCompare(b.patientName));

        setGroupedPatientData(processedData);
        setIsLoadingRecords(false);
      }
    }
  }, [user, authLoading, isAdmin, isPharmacist, router, canViewPage]);

  const togglePatientExpansion = (patientName: string) => {
    setExpandedPatients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(patientName)) {
        newSet.delete(patientName);
      } else {
        newSet.add(patientName);
      }
      return newSet;
    });
  };

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
            Manage and view patient prescription history.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prescription List</CardTitle>
          <CardDescription>
            The table shows the most recent reviewed or packed record per patient.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Name</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Parsed At
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedPatientData.length === 0 && !isLoadingRecords ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No reviewed or packed patient records found. Process prescriptions on the home page.
                  </TableCell>
                </TableRow>
              ) : (
                groupedPatientData.map(({ patientName, records }) => {
                  const mostRecentRecord = records[0];
                  const isExpanded = expandedPatients.has(patientName);
                  return (
                    <React.Fragment key={patientName}>
                      <TableRow className={isExpanded ? "bg-accent/10" : ""}>
                        <TableCell className="font-medium">
                          <Button 
                            variant="ghost" 
                            onClick={() => togglePatientExpansion(patientName)}
                            className="p-1 h-auto justify-start w-full text-left hover:bg-accent/20"
                            aria-expanded={isExpanded}
                            aria-controls={`patient-history-${patientName.replace(/\s+/g, '-')}`}
                          >
                            {isExpanded 
                              ? <ChevronUp className="h-4 w-4 mr-2 shrink-0" /> 
                              : <ChevronDown className="h-4 w-4 mr-2 shrink-0" />}
                            {patientName || 'N/A'} ({records.length} record{records.length === 1 ? '' : 's'})
                          </Button>
                        </TableCell>
                        <TableCell>{mostRecentRecord?.medicationName || 'N/A'}</TableCell>
                        <TableCell>{mostRecentRecord?.dosage || 'N/A'}</TableCell>
                        <TableCell>
                          {mostRecentRecord?.parsedAt ? format(new Date(mostRecentRecord.parsedAt), "yyyy-MM-dd HH:mm") : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {mostRecentRecord?.status && (
                            <Badge variant={getStatusBadgeVariant(mostRecentRecord.status)}>
                              {statusDisplay[mostRecentRecord.status] || 'Unknown'}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={5} className="p-0">
                            <div className="bg-muted/20 p-2 border-l-4 border-accent">
                              <Table>
                                <TableBody>
                                  {records.slice(1).map((record, index) => (
                                    <TableRow key={record.id || `${patientName}-hist-${index}`} className="hover:bg-muted/40">
                                      <TableCell className="w-[25%] pl-6 text-xs text-muted-foreground">
                                        {/* Intentionally left blank or could show date again */}
                                      </TableCell>
                                      <TableCell className="w-[20%] text-xs">{record.medicationName || 'N/A'}</TableCell>
                                      <TableCell className="w-[15%] text-xs">{record.dosage || 'N/A'}</TableCell>
                                      <TableCell className="w-[20%] text-xs">
                                        {record.parsedAt ? format(new Date(record.parsedAt), "yyyy-MM-dd HH:mm") : 'N/A'}
                                      </TableCell>
                                      <TableCell className="w-[20%]">
                                        {record.status && (
                                          <Badge variant={getStatusBadgeVariant(record.status)} className="text-xs px-1.5 py-0.5">
                                            {statusDisplay[record.status] || 'Unknown'}
                                          </Badge>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  {records.length === 1 && (
                                     <TableRow>
                                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-2">
                                        No other historical records for this patient.
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

