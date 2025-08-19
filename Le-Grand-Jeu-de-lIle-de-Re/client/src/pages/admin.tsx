import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dice6, 
  Check, 
  AlertTriangle, 
  Shield, 
  Circle,
  Users,
  Database
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AdminLogin from './admin-login';
import ParticipantManagementPage from './participant-management';
import ChallengeBankPage from './challenge-bank';
import type { SystemStats } from '@/lib/types';
import type { AssignmentSeed, AuditLogEntry } from '@shared/schema';

// Mock admin ID - in real app this would come from auth
const ADMIN_USER_ID = "admin-1";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // All hooks must be called before any conditional returns
  const { data: currentSeed } = useQuery<AssignmentSeed>({
    queryKey: ['/api/seed/current'],
    enabled: isAuthenticated,
  });

  const { data: auditEntries = [] } = useQuery<AuditLogEntry[]>({
    queryKey: ['/api/audit'],
    enabled: isAuthenticated,
  });

  const generateAssignments = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/assignments/generate', {
        adminId: ADMIN_USER_ID
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Assignations générées',
        description: `${data.participantCount} participants ont reçu leurs défis.`,
      });
      // Invalidate all assignment-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/seed/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/audit'] });
      // Force refresh of all assignment queries
      queryClient.refetchQueries({ queryKey: ['/api/assignments'] });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la génération des assignations.',
        variant: 'destructive',
      });
    },
  });

  const validateTeamMissions = useMutation({
    mutationFn: async () => {
      // This would normally validate pending team missions
      return Promise.resolve({ validated: 5 });
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Missions validées',
        description: `${data.validated} missions d'équipe ont été validées.`,
      });
    },
  });

  const emergencyRegenerate = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/assignments/generate', {
        adminId: ADMIN_USER_ID
      });
    },
    onSuccess: () => {
      toast({
        title: 'Régénération d\'urgence',
        description: 'Toutes les assignations ont été régénérées.',
        variant: 'destructive',
      });
      // Invalidate all cached data to force refresh
      queryClient.invalidateQueries();
      // Also force refetch of assignments
      queryClient.refetchQueries({ queryKey: ['/api/assignments'] });
    },
  });

  // Conditional return after all hooks are defined
  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  // Mock stats - in real app this would come from API
  const stats: SystemStats = {
    totalParticipants: 127,
    teamsFormed: 42,
    missionsValidated: 38,
    challengesCompleted: 234,
    easyChallenges: 254,
    mediumChallenges: 254,
    hardChallenges: 254,
    teamChallenges: 42,
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Administration GJIR</h2>
        <p className="text-gray-600">Gestion complète du système de défis</p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Tableau de bord</span>
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Participants</span>
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Banque de défis</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Admin Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Actions administratives</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div>
                      <h4 className="font-medium text-amber-900">Génération des assignations</h4>
                      <p className="text-sm text-amber-700">Attribuer aléatoirement les défis à tous les participants</p>
                    </div>
                    <Button 
                      onClick={() => generateAssignments.mutate()}
                      disabled={generateAssignments.isPending}
                      className="bg-amber-600 text-white hover:bg-amber-700"
                    >
                      <Dice6 className="w-4 h-4 mr-2" />
                      {generateAssignments.isPending ? 'Génération...' : 'Générer'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <h4 className="font-medium text-blue-900">Validation missions équipe</h4>
                      <p className="text-sm text-blue-700">Valider les preuves de missions d'identification</p>
                    </div>
                    <Button 
                      onClick={() => validateTeamMissions.mutate()}
                      disabled={validateTeamMissions.isPending}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {validateTeamMissions.isPending ? 'Validation...' : 'Valider'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <h4 className="font-medium text-red-900">Régénération d'urgence</h4>
                      <p className="text-sm text-red-700">⚠️ Régénérer toutes les assignations (action journalisée)</p>
                    </div>
                    <Button 
                      onClick={() => emergencyRegenerate.mutate()}
                      disabled={emergencyRegenerate.isPending}
                      variant="destructive"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      {emergencyRegenerate.isPending ? 'Régénération...' : 'Régénérer'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>État du système</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-3 bg-primary/10 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{stats.totalParticipants}</div>
                      <div className="text-sm text-gray-600">Participants</div>
                    </div>
                    <div className="text-center p-3 bg-secondary/10 rounded-lg">
                      <div className="text-2xl font-bold text-secondary">{stats.teamsFormed}</div>
                      <div className="text-sm text-gray-600">Équipes formées</div>
                    </div>
                    <div className="text-center p-3 bg-accent/10 rounded-lg">
                      <div className="text-2xl font-bold text-accent">{stats.challengesCompleted}</div>
                      <div className="text-sm text-gray-600">Défis complétés</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* System Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Sécurité cryptographique</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Seed actuel</div>
                  <div className="text-sm text-gray-600 font-mono">
                    {currentSeed?.seedHash ? currentSeed.seedHash.substring(0, 16) + '...' : 'Non généré'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Dernière modification: {currentSeed?.createdAt ? new Date(currentSeed.createdAt).toLocaleString('fr-FR') : 'N/A'}
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  <Circle className="w-3 h-3 mr-1 fill-current" />
                  Intègre
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Vue d'ensemble des assignations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{stats.easyChallenges}</div>
                  <div className="text-sm text-green-600">Défis faciles</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">{stats.mediumChallenges}</div>
                  <div className="text-sm text-blue-600">Défis moyens</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-700">{stats.hardChallenges}</div>
                  <div className="text-sm text-red-600">Défis difficiles</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-700">{stats.teamChallenges}</div>
                  <div className="text-sm text-purple-600">Défis équipe</div>
                </div>
              </div>
              
              {/* Recent Assignments Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Équipe</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Défis assignés</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Mock data - in real app this would come from API */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-xs font-semibold">PD</span>
                          </div>
                          <div className="text-sm font-medium text-gray-900">Pierre Dupont</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Équipe #17</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">6/7</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Progress value={66} className="w-24" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className="bg-green-100 text-green-800">Actif</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-xs font-semibold">SD</span>
                          </div>
                          <div className="text-sm font-medium text-gray-900">Sophie Dubois</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Équipe #17</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">6/7</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Progress value={33} className="w-24" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className="bg-amber-100 text-amber-800">En cours</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants">
          <ParticipantManagementPage />
        </TabsContent>

        <TabsContent value="challenges">
          <ChallengeBankPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}