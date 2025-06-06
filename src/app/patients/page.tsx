
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Users, AlertTriangle, Info, Clock, ChevronDown, ChevronUp, CheckCircle, PackageCheck, MoreHorizontal, Trash2 } from 'lucide-react';
import type { MedicationData, MedicationStatus } from '@/lib/types';
import { getAllPatientRecords, upsertPatientRecord, deletePatientRecord } from '@/lib/patient-data';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const statusDisplay: Record<MedicationStatus, string> = {
  pending_extraction: "Pending Extraction",
  pending_review: "Pending Review",
  reviewed: "Reviewed",
  approved: "Approved",
  packed: "Packed",
};

const getStatusBadgeVariant = (status?: MedicationStatus) => {
  switch (status) {
    case 'pending_review': return 'destructive';
    case 'reviewed': return 'secondary';
    case 'approved': return 'default'; // Positive color
    case 'packed': return 'default'; // Positive color
    default: return 'outline';
  }
};

interface GroupedPatientData {
  patientName: string;
  records: MedicationData[];
}

export default function PatientsPage() {
  const { user, loading: authLoading, isAdmin, isPharmacist, isTechnician } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [groupedPatientData, setGroupedPatientData] = useState<GroupedPatientData[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const [recordToDelete, setRecordToDelete] = useState<MedicationData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const canViewPage = isAdmin || isPharmacist || isTechnician;
  const canDeleteRecords = isAdmin || isPharmacist;

  const fetchAndProcessRecords = useCallback(() => {
    setIsLoadingRecords(true);
    const allRecords = getAllPatientRecords();

    let relevantRecords;
    if (isTechnician && !isAdmin && !isPharmacist) {
      // Technicians see only 'approved' or 'packed' records
      relevantRecords = allRecords.filter(r => r.status === 'approved' || r.status === 'packed');
    } else {
      // Admins and Pharmacists see 'reviewed', 'approved', or 'packed' records
      relevantRecords = allRecords.filter(r => r.status === 'reviewed' || r.status === 'approved' || r.status === 'packed');
    }

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
        return dateB - dateA;
      });
      return {
        patientName: name,
        records: sortedRecords,
      };
    });

    processedData.sort((a,b) => a.patientName.localeCompare(b.patientName));
    setGroupedPatientData(processedData);
    setIsLoadingRecords(false);
  }, [isTechnician, isAdmin, isPharmacist]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !canViewPage) {
        router.replace('/login?redirect=/patients');
      } else {
        fetchAndProcessRecords();
      }
    }
  }, [user, authLoading, router, canViewPage, fetchAndProcessRecords]);

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

  const handleApproveRecord = (recordToApprove: MedicationData) => {
    if (!recordToApprove || !recordToApprove.id) return;

    const canPerformApprove = 
      (isAdmin && (recordToApprove.status === 'reviewed' || recordToApprove.status === 'packed')) ||
      (isPharmacist && recordToApprove.status === 'reviewed');

    if (!canPerformApprove) {
        toast({ variant: "destructive", title: "Action Denied", description: "You do not have permission to approve this record in its current state." });
        return;
    }

    const updatedRecord = { ...recordToApprove, status: 'approved' as MedicationStatus };
    upsertPatientRecord(updatedRecord);
    toast({
      title: "Prescription Approved",
      description: `${recordToApprove.medicationName} for ${recordToApprove.patientName} marked as approved.`,
    });
    fetchAndProcessRecords();
  };

  const handleMarkAsPackedOnPatientsPage = (recordToPack: MedicationData) => {
    if (!recordToPack || !recordToPack.id ) return;
    
    const canPerformPack = 
        (isAdmin && (recordToPack.status === 'approved' || recordToPack.status === 'packed')) || // Admin can re-pack
        (isPharmacist && recordToPack.status === 'approved') ||
        (isTechnician && recordToPack.status === 'approved');


    if (!canPerformPack) {
      toast({ variant: "destructive", title: "Action Denied", description: "Record must be 'approved' to be packed by your role, or you are an admin re-packing." });
      return;
    }
     if (recordToPack.status === 'packed' && !isAdmin) {
      toast({ variant: "destructive", title: "Already Packed", description: "This record is already packed." });
      return;
    }


    const updatedRecord = { ...recordToPack, status: 'packed' as MedicationStatus };
    upsertPatientRecord(updatedRecord);
    toast({
      title: "Prescription Packed",
      description: `${recordToPack.medicationName} for ${recordToPack.patientName} marked as packed.`,
    });
    fetchAndProcessRecords();
  };

  const openDeleteDialog = (record: MedicationData) => {
    if (!canDeleteRecords) {
        toast({variant: "destructive", title: "Permission Denied", description: "You cannot delete records."});
        return;
    }
    setRecordToDelete(record);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteRecord = () => {
    if (!recordToDelete || !recordToDelete.id || !canDeleteRecords) return;

    const success = deletePatientRecord(recordToDelete.id);
    if (success) {
      toast({
        title: "Record Deleted",
        description: `Prescription for ${recordToDelete.medicationName} (${recordToDelete.patientName}) has been deleted.`,
      });
      fetchAndProcessRecords();
    } else {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Could not delete the record. It might have already been removed or an error occurred.",
      });
    }
    setIsDeleteDialogOpen(false);
    setRecordToDelete(null);
  };


  if (authLoading || (isLoadingRecords && canViewPage)) {
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

  const pageTitle = (isTechnician && !isAdmin && !isPharmacist) ? "Approved Prescriptions for Packing" : "Patient Records";
  const pageDescription = (isTechnician && !isAdmin && !isPharmacist)
    ? "View approved prescriptions and mark them as packed. Click patient name to see history."
    : "Manage and view patient prescription history. Click patient name to see history.";


  const renderActionsDropdown = (record: MedicationData) => {
    // Approve Action
    const showApproveAction = 
        (isAdmin && (record.status === 'reviewed' || record.status === 'packed')) ||
        (isPharmacist && record.status === 'reviewed');

    // Pack Action
    const showPackAction = 
        (isAdmin && (record.status === 'approved' || record.status === 'packed')) || // Admin can (re)pack 'approved' or 'packed'
        (isPharmacist && record.status === 'approved') ||
        (isTechnician && record.status === 'approved');
    
    const disablePackIfAlreadyPackedNonAdmin = record.status === 'packed' && !isAdmin;

    // Delete Action
    const showDeleteAction = canDeleteRecords; 

    if (!showApproveAction && !showPackAction && !showDeleteAction) {
      return <span className="text-xs text-muted-foreground">No actions</span>;
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {showApproveAction && (
            <DropdownMenuItem onClick={() => handleApproveRecord(record)} disabled={record.status === 'packed' && !isAdmin}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </DropdownMenuItem>
          )}
          {showPackAction && (
            <DropdownMenuItem onClick={() => handleMarkAsPackedOnPatientsPage(record)} disabled={disablePackIfAlreadyPackedNonAdmin}>
              <PackageCheck className="mr-2 h-4 w-4" />
              {record.status === 'packed' && isAdmin ? 'Re-Pack' : 'Mark as Packed'}
            </DropdownMenuItem>
          )}
          {showDeleteAction && (showApproveAction || showPackAction) && <DropdownMenuSeparator />}
          {showDeleteAction && (
            <DropdownMenuItem onClick={() => openDeleteDialog(record)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Record
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };


  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            {pageTitle}
          </h1>
          <p className="text-muted-foreground">
            {pageDescription}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prescription List</CardTitle>
          <CardDescription>
            {(isTechnician && !isAdmin && !isPharmacist)
              ? "The table shows approved and packed prescriptions. Click patient name to see history."
              : "The table shows the most recent reviewed, approved, or packed record per patient. Click patient name to see history."
            }
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedPatientData.length === 0 && !isLoadingRecords ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {(isTechnician && !isAdmin && !isPharmacist) ? "No approved or packed prescriptions found." : "No relevant patient records found."}
                  </TableCell>
                </TableRow>
              ) : (
                groupedPatientData.map(({ patientName, records }) => {
                  const mostRecentRecord = records[0]; // This will be the one displayed primarily
                  const isExpanded = expandedPatients.has(patientName);

                  return (
                    <React.Fragment key={patientName}>
                      <TableRow className={isExpanded ? "bg-muted/10" : ""}>
                        <TableCell className="font-medium">
                          <Button
                            variant="ghost"
                            onClick={() => togglePatientExpansion(patientName)}
                            className="p-1 h-auto justify-start w-full text-left hover:bg-muted/20"
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
                        <TableCell className="text-right">
                          {mostRecentRecord ? renderActionsDropdown(mostRecentRecord) : null}
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={6} className="p-0">
                            <div className="bg-muted/20 p-2 border-l-4 border-primary/20">
                              <Table>
                                <TableBody>
                                  {records.slice(1).map((record, index) => { // Display older records
                                    return (
                                      <TableRow key={record.id || `${patientName}-hist-${index}`} className="hover:bg-muted/40">
                                        <TableCell className="w-[25%] pl-6 text-xs text-muted-foreground">
                                          {/* Intentionally left blank for alignment with parent row */}
                                        </TableCell>
                                        <TableCell className="w-[18%] text-xs">{record.medicationName || 'N/A'}</TableCell>
                                        <TableCell className="w-[14%] text-xs">{record.dosage || 'N/A'}</TableCell>
                                        <TableCell className="w-[18%] text-xs">
                                          {record.parsedAt ? format(new Date(record.parsedAt), "yyyy-MM-dd HH:mm") : 'N/A'}
                                        </TableCell>
                                        <TableCell className="w-[15%]">
                                          {record.status && (
                                            <Badge variant={getStatusBadgeVariant(record.status)} className="text-xs px-1.5 py-0.5">
                                              {statusDisplay[record.status] || 'Unknown'}
                                            </Badge>
                                          )}
                                        </TableCell>
                                        <TableCell className="w-[10%] text-right">
                                          {renderActionsDropdown(record)}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                  {records.length === 1 && ( // Only one record total for this patient
                                     <TableRow>
                                      <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-2">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the prescription record for {' '}
              <span className="font-semibold">{recordToDelete?.medicationName}</span>
              {' for patient '}
              <span className="font-semibold">{recordToDelete?.patientName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsDeleteDialogOpen(false); setRecordToDelete(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteRecord}
              className={buttonVariants({variant: "destructive"})}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

