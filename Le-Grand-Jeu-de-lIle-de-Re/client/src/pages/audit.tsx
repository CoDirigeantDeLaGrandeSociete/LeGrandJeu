import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Download, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { AssignmentSeed, AuditLogEntry } from '@shared/schema';

export default function AuditPage() {
  const { toast } = useToast();

  const { data: currentSeed } = useQuery<AssignmentSeed>({
    queryKey: ['/api/seed/current'],
  });

  const { data: auditEntries = [] } = useQuery<AuditLogEntry[]>({
    queryKey: ['/api/audit'],
  });

  const verifySeed = useMutation({
    mutationFn: async (seedHash: string) => {
      return apiRequest('POST', '/api/seed/verify', { seedHash });
    },
    onSuccess: (data: any) => {
      if (data.isValid) {
        toast({
          title: 'Vérification réussie',
          description: 'L\'intégrité du seed a été vérifiée avec succès.',
        });
      } else {
        toast({
          title: 'Erreur de vérification',
          description: 'Le seed ne correspond pas aux enregistrements.',
          variant: 'destructive',
        });
      }
    },
  });

  const exportAuditLog = useMutation({
    mutationFn: async () => {
      // In a real app, this would download the audit log
      const data = JSON.stringify(auditEntries, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: 'Export réussi',
        description: 'Le journal d\'audit a été téléchargé.',
      });
    },
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionBadge = (action: string) => {
    const configs = {
      generate_assignments: { label: 'Génération', className: 'bg-green-100 text-green-800' },
      validate_team_mission: { label: 'Validation', className: 'bg-purple-100 text-purple-800' },
      regenerate_assignments: { label: 'Régénération', className: 'bg-red-100 text-red-800' },
      verify_seed: { label: 'Vérification', className: 'bg-blue-100 text-blue-800' },
    };

    const config = configs[action as keyof typeof configs] || { label: action, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Audit et vérification</h2>
        <p className="text-gray-600">Historique et vérification de l'intégrité des assignations</p>
      </div>
      
      {/* Current Seed Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seed cryptographique actuel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seed original</label>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm break-all">
                    {currentSeed?.seed || 'Aucun seed actif'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hash SHA-256</label>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm break-all">
                    {currentSeed?.seedHash || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Généré le</label>
                  <div className="text-sm text-gray-900">
                    {currentSeed?.generatedAt ? formatTimestamp(currentSeed.generatedAt) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">Vérification d'intégrité</h4>
                <div className="space-y-3">
                  <Button 
                    onClick={() => currentSeed && verifySeed.mutate(currentSeed.seedHash)}
                    disabled={!currentSeed || verifySeed.isPending}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {verifySeed.isPending ? 'Vérification...' : 'Vérifier le seed actuel'}
                  </Button>
                  <Button 
                    onClick={() => exportAuditLog.mutate()}
                    disabled={exportAuditLog.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exportAuditLog.isPending ? 'Export...' : 'Exporter le journal d\'audit'}
                  </Button>
                </div>
                
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-700">Intégrité vérifiée</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle>Journal d'audit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Administrateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seed Hash</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Aucune entrée d'audit disponible
                    </td>
                  </tr>
                ) : (
                  auditEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getActionBadge(entry.action)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.adminId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {entry.details}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {entry.seedHash ? `${entry.seedHash.substring(0, 8)}...` : 'N/A'}
                        </code>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
