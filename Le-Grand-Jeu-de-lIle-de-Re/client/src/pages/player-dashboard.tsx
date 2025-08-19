import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChallengeCard } from '@/components/challenge-card';
import { FileUploadModal } from '@/components/file-upload-modal';
import { 
  Users, 
  Lock, 
  Camera, 
  TriangleAlert,
  CheckCircle 
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Assignment, Challenge, User, Team, TeamMember, Proof } from '@shared/schema';

// Mock user ID - in real app this would come from auth
const CURRENT_USER_ID = "user-1";

export default function PlayerDashboard() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | undefined>();
  const [teamUploadModalOpen, setTeamUploadModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<(Assignment & { challenge: Challenge; targetUser?: User })[]>({
    queryKey: ['/api/assignments', CURRENT_USER_ID],
    enabled: !!CURRENT_USER_ID,
  });

  const { data: team } = useQuery<Team & { members: (TeamMember & { user: User })[] }>({
    queryKey: ['/api/team', CURRENT_USER_ID],
    enabled: !!CURRENT_USER_ID,
  });

  const { data: teamProofs = [] } = useQuery<Proof[]>({
    queryKey: ['/api/proofs/team', team?.id],
    enabled: !!team?.id,
  });

  const startChallenge = useMutation({
    mutationFn: async (assignmentId: string) => {
      return apiRequest('PATCH', `/api/assignments/${assignmentId}/status`, {
        status: 'in_progress'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments', CURRENT_USER_ID] });
      toast({
        title: 'Défi commencé',
        description: 'Le défi a été marqué comme commencé.',
      });
    },
  });

  const handleUploadProof = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setUploadModalOpen(true);
  };

  const handleStartChallenge = (assignmentId: string) => {
    startChallenge.mutate(assignmentId);
  };

  const handleTeamUpload = () => {
    setTeamUploadModalOpen(true);
  };

  if (assignmentsLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  // Separate individual and team assignments
  const individualAssignments = assignments.filter((a: Assignment & { challenge: Challenge }) => 
    a.challenge.difficulty !== 'team'
  );

  const stats = {
    completed: individualAssignments.filter((a: Assignment) => a.status === 'validated').length,
    total: individualAssignments.length,
    points: individualAssignments
      .filter((a: Assignment & { challenge: Challenge }) => a.status === 'validated')
      .reduce((sum: number, a: Assignment & { challenge: Challenge }) => sum + a.challenge.points, 0),
    potentialPoints: individualAssignments
      .reduce((sum: number, a: Assignment & { challenge: Challenge }) => sum + a.challenge.points, 0),
  };

  const teamProofCount = teamProofs.filter((p: any) => !p.isValidated).length;
  const teamProofProgress = team?.members?.length ? 
    Math.min((teamProofCount / Math.max(2, Math.ceil(team.members.length / 2))) * 100, 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Mon coffre aux défis</h2>
        <p className="text-gray-600">Vos 7 défis personnalisés pour le Grand Jeu de l'Île de Ré</p>
      </div>
      
      {/* Challenge Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-secondary">{stats.completed}/{stats.total}</div>
            <div className="text-sm text-gray-600">Défis terminés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.points}</div>
            <div className="text-sm text-gray-600">Points gagnés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-accent">1</div>
            <div className="text-sm text-gray-600">Mission équipe</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-700">{stats.potentialPoints}</div>
            <div className="text-sm text-gray-600">Score potentiel</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Individual Challenges */}
      <div className="space-y-4 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Défis individuels</h3>
        {individualAssignments.map((assignment: Assignment & { challenge: Challenge; targetUser?: User }) => (
          <ChallengeCard
            key={assignment.id}
            assignment={assignment}
            onUploadProof={handleUploadProof}
            onStartChallenge={handleStartChallenge}
          />
        ))}
      </div>
      
      {/* Team Challenge Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Défi d'équipe</h3>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Badge className="bg-purple-100 text-purple-800">
                  <Users className="w-3 h-3 mr-1" />
                  Équipe • 3 pts/membre
                </Badge>
                <Badge className="bg-amber-100 text-amber-800">
                  <Lock className="w-3 h-3 mr-1" />
                  Mission d'identification
                </Badge>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Mission d'identification (non scorée)</h4>
              
              {!team?.identificationMissionValidated && (
                <>
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 mb-4">
                    <div className="flex items-start space-x-3">
                      <TriangleAlert className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <strong>Important :</strong> Vous devez d'abord accomplir la mission d'identification pour révéler vos coéquipiers et débloquer le défi d'équipe.
                      </div>
                    </div>
                  </div>
                  
                  {team && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h5 className="font-semibold text-gray-900 mb-2">{team.identificationMissionTitle}</h5>
                      <p className="text-gray-600 text-sm mb-3">{team.identificationMissionDescription}</p>
                      <div className="text-xs text-gray-500">
                        <Camera className="inline w-3 h-3 mr-1" />
                        Preuve attendue : Photo de groupe géolocalisée
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">État des preuves soumises</span>
                      <span className="text-sm text-gray-500">{teamProofCount}/2 minimum requis</span>
                    </div>
                    <Progress value={teamProofProgress} className="h-2" />
                    <div className="text-xs text-gray-500">
                      {teamProofCount} preuve{teamProofCount !== 1 ? 's' : ''} soumise{teamProofCount !== 1 ? 's' : ''} par des membres de l'équipe
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleTeamUpload}
                    className="w-full sm:w-auto bg-accent text-white hover:bg-amber-600 mt-4"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Soumettre ma preuve
                  </Button>
                </>
              )}
              
              {team?.identificationMissionValidated && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="text-sm text-green-800">
                      <strong>Mission accomplie !</strong> Vos coéquipiers ont été révélés et le défi d'équipe est maintenant disponible.
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Hidden team challenge */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {team?.identificationMissionValidated ? 'Défi d\'équipe' : 'Défi d\'équipe (verrouillé)'}
              </h4>
              {!team?.identificationMissionValidated ? (
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Le défi d'équipe sera révélé une fois la mission d'identification validée.</p>
                </div>
              ) : (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">Défi d'équipe débloqué</h5>
                  <p className="text-gray-600 text-sm">Rendez-vous dans l'onglet "Équipe" pour voir le défi et collaborer avec vos coéquipiers.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <FileUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        assignmentId={selectedAssignmentId}
        userId={CURRENT_USER_ID}
      />

      <FileUploadModal
        isOpen={teamUploadModalOpen}
        onClose={() => setTeamUploadModalOpen(false)}
        teamId={team?.id}
        userId={CURRENT_USER_ID}
      />
    </div>
  );
}
