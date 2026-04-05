import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import {
  AlertTriangle,
  GitMerge,
  Trash2,
  Check,
  X,
  Users,
  Shield,
} from '@tripalfa/ui-components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/optics';
import { Button } from '@/components/optics';
import { Badge } from '@/components/optics';
import { StatusBadge } from '@tripalfa/ui-components';
import { cn } from '@tripalfa/shared-utils/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/optics';

interface DuplicateMatch {
  id: string;
  recordA: {
    id: string;
    name: string;
    email: string;
    type: 'CONTACT' | 'KYC_SUBMISSION';
    kycStatus?: string;
  };
  recordB: {
    id: string;
    name: string;
    email: string;
    type: 'CONTACT' | 'KYC_SUBMISSION';
    kycStatus?: string;
  };
  matchScore: number;
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  matchFields: Array<{ field: string; similarity: number }>;
  status: 'PENDING' | 'MERGED' | 'REJECTED' | 'MANUAL_REVIEW';
  detectedAt: string;
}

export default function MatchParticipantPage() {
  const [selectedMatch, setSelectedMatch] = useState<DuplicateMatch | null>(null);
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [mergePreference, setMergePreference] = useState<'A' | 'B'>('A');

  const {
    data: matches,
    isLoading,
    refetch,
  } = useQuery<DuplicateMatch[]>({
    queryKey: ['duplicate-matches'],
    queryFn: async () => {
      const response = await api.get('/crm/duplicates');
      return response.data;
    },
  });

  const rejectMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      await api.post(`/crm/duplicates/${matchId}/reject`);
    },
    onSuccess: () => refetch(),
  });

  const mergeRecordsMutation = useMutation({
    mutationFn: async (data: { matchId: string; preference: 'A' | 'B' }) => {
      const response = await api.post('/crm/duplicates/merge', data);
      return response.data;
    },
    onSuccess: () => {
      refetch();
      setIsMergeOpen(false);
      setSelectedMatch(null);
    },
  });

  const getConfidenceStatus = (
    level: string
  ): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const statusMap = {
      LOW: 'info' as const,
      MEDIUM: 'warning' as const,
      HIGH: 'warning' as const,
      CRITICAL: 'primary' as const,
    };
    return statusMap[level as keyof typeof statusMap] || 'default';
  };

  const pending = matches?.filter(m => m.status === 'PENDING') || [];
  const critical = pending.filter(m => m.confidenceLevel === 'CRITICAL') || [];
  const kycDuplicates =
    pending.filter(
      m => m.recordA.type === 'KYC_SUBMISSION' || m.recordB.type === 'KYC_SUBMISSION'
    ) || [];

  return (
    <div className="space-y-5">
      <div className="action-row">
        <div>
          <h1 className="text-page-title">Duplicate Detection & Merging</h1>
          <p className="text-caption mt-1">
            Identify and resolve duplicate records and KYC submissions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-900">Pending Review</p>
            <p className="text-2xl font-bold text-orange-900 mt-2">{pending.length}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-900">Critical Matches</p>
            <p className="text-2xl font-bold text-red-900 mt-2">{critical.length}</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <p className="text-sm text-purple-900">KYC Related</p>
            <p className="text-2xl font-bold text-purple-900 mt-2">{kycDuplicates.length}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-sm text-green-900">Already Merged</p>
            <p className="text-2xl font-bold text-green-900 mt-2">
              {matches?.filter(m => m.status === 'MERGED').length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading duplicates...</div>
      ) : pending.length === 0 ? (
        <Card className="text-center">
          <CardContent className="pt-12 pb-12">
            <Check className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <p className="font-semibold">No duplicates found</p>
            <p className="text-sm text-muted-foreground mt-1">Your records are clean!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.map(match => (
            <Card
              key={match.id}
              className={`border-l-4 ${
                match.confidenceLevel === 'CRITICAL'
                  ? 'border-l-red-500 bg-red-50'
                  : match.confidenceLevel === 'HIGH'
                    ? 'border-l-orange-500'
                    : 'border-l-yellow-500'
              }`}
            >
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">Potential Duplicate Detected</h3>
                        <StatusBadge
                          status={getConfidenceStatus(match.confidenceLevel)}
                          label={match.confidenceLevel}
                          size="sm"
                        />
                        {kycDuplicates.includes(match) && (
                          <Badge className="bg-purple-100 text-purple-800">
                            <Shield size={12} className="mr-1" />
                            KYC Related
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Match Score:{' '}
                        <span className="font-semibold">
                          {(match.matchScore * 100).toFixed(0)}%
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 items-center">
                    <div className="col-span-2 border-r pr-4">
                      <p className="font-medium text-sm">{match.recordA.name}</p>
                      <p className="text-xs text-muted-foreground">{match.recordA.email}</p>
                      <Badge variant="outline" className="mt-1">
                        {match.recordA.type}
                      </Badge>
                      {match.recordA.kycStatus && (
                        <p className="text-xs mt-1">KYC: {match.recordA.kycStatus}</p>
                      )}
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <GitMerge className="w-5 h-5 text-muted-foreground" />
                    </div>

                    <div className="col-span-2 border-l pl-4">
                      <p className="font-medium text-sm">{match.recordB.name}</p>
                      <p className="text-xs text-muted-foreground">{match.recordB.email}</p>
                      <Badge variant="outline" className="mt-1">
                        {match.recordB.type}
                      </Badge>
                      {match.recordB.kycStatus && (
                        <p className="text-xs mt-1">KYC: {match.recordB.kycStatus}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded p-3 space-y-2">
                    <p className="text-sm font-medium">Matching Fields:</p>
                    <div className="flex flex-wrap gap-2">
                      {match.matchFields.map((field, idx) => (
                        <Badge key={idx} variant="outline">
                          {field.field}: {(field.similarity * 100).toFixed(0)}%
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rejectMatchMutation.mutate(match.id)}
                      disabled={rejectMatchMutation.isPending}
                    >
                      <X size={16} className="mr-1" />
                      Not a Match
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedMatch(match);
                        setIsMergeOpen(true);
                      }}
                    >
                      <GitMerge size={16} className="mr-1" />
                      Merge Records
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isMergeOpen} onOpenChange={setIsMergeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Merge Duplicate Records</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose which record to keep as the primary:
              </p>

              <div className="space-y-3">
                <div
                  className={`p-4 border rounded-lg cursor-pointer ${
                    mergePreference === 'A' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setMergePreference('A')}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      id="merge-preference-a"
                      name="mergePreference"
                      value="A"
                      checked={mergePreference === 'A'}
                      readOnly
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium">{selectedMatch.recordA.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedMatch.recordA.email}</p>
                      <p className="text-xs mt-1">{selectedMatch.recordA.type}</p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 border rounded-lg cursor-pointer ${
                    mergePreference === 'B' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setMergePreference('B')}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      id="merge-preference-b"
                      name="mergePreference"
                      value="B"
                      checked={mergePreference === 'B'}
                      readOnly
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium">{selectedMatch.recordB.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedMatch.recordB.email}</p>
                      <p className="text-xs mt-1">{selectedMatch.recordB.type}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <p className="text-xs text-orange-900">
                  <AlertTriangle size={14} className="inline mr-2" />
                  The other record will be merged into this one. You can undo this action for 30
                  days.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMergeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedMatch &&
                mergeRecordsMutation.mutate({
                  matchId: selectedMatch.id,
                  preference: mergePreference,
                })
              }
              disabled={mergeRecordsMutation.isPending}
            >
              Merge Records
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
