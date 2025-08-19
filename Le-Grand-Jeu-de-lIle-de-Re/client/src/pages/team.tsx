import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileUploadModal } from '@/components/file-upload-modal';
import { 
  Users, 
  Search, 
  MapPin, 
  Clock, 
  Camera, 
  CheckCircle,
  Trophy,
  Utensils,
  Sun,
  Play,
  Circle
} from 'lucide-react';
import { useState } from 'react';
import type { Team, TeamMember, User, Proof } from '@shared/schema';

// Mock user ID - in real app this would come from auth
const CURRENT_USER_ID = "user-1";

export default function TeamPage() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const { data: team } = useQuery<Team & { members: (TeamMember & { user: User })[] }>({
    queryKey: ['/api/team', CURRENT_USER_ID],
    enabled: !!CURRENT_USER_ID,
  });

  const { data: teamProofs = [] } = useQuery<Proof[]>({
    queryKey: ['/api/proofs/team', team?.id],
    enabled: !!team?.id,
  });

  if (!team) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune équipe assignée</h2>
          <p className="text-gray-600">Attendez que les assignations soient générées par l'administration.</p>
        </div>
      </div>
    );
  }

  const teamProofCount = teamProofs.filter(p => !p.isValidated).length;
  const requiredProofs = Math.max(2, Math.ceil(team.members.length / 2));
  const teamProofProgress = Math.min((teamProofCount / requiredProofs) * 100, 100);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getInitialColor = (index: number) => {
    const colors = ['bg-primary', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-pink-500'];
    return colors[index % colors.length];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Mon équipe</h2>
        <p className="text-gray-600">Collaboration et défis d'équipe</p>
      </div>
      
      {/* Team Identification Mission (Before Validation) */}
      {!team.identificationMissionValidated && (
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Mission d'identification en cours</h3>
                <p className="text-gray-600">Vos coéquipiers seront révélés une fois la mission accomplie</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">{team.identificationMissionTitle}</h4>
                <p className="text-gray-600 mb-4">{team.identificationMissionDescription}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <Users className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">Équipe de {team.members.length}</div>
                    <div className="text-xs text-gray-500">membres</div>
                  </div>
                  <div className="text-center">
                    <MapPin className="h-6 w-6 text-red-500 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">Lieu</div>
                    <div className="text-xs text-gray-500">À déterminer</div>
                  </div>
                  <div className="text-center">
                    <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">Flexible</div>
                    <div className="text-xs text-gray-500">Créneau</div>
                  </div>
                </div>
              </div>
              
              {/* Anonymous progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Preuves soumises</span>
                  <span className="text-sm text-gray-500">{teamProofCount}/{requiredProofs} minimum</span>
                </div>
                <Progress value={teamProofProgress} className="h-3 mb-2" />
                <div className="text-xs text-gray-500">
                  {teamProofCount} membre{teamProofCount !== 1 ? 's ont' : ' a'} soumis une preuve{teamProofCount !== 1 ? 's' : ''}
                </div>
              </div>
              
              <Button 
                onClick={() => setUploadModalOpen(true)}
                className="w-full bg-accent text-white hover:bg-amber-600"
              >
                <Camera className="w-4 h-4 mr-2" />
                Soumettre ma preuve
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Team Revealed (After Mission Validation) */}
      {team.identificationMissionValidated && (
        <div>
          {/* Team Members */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Équipe révélée !</h3>
                  <p className="text-gray-600">Mission d'identification validée</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {team.members.map((member, index) => (
                  <div key={member.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-10 h-10 ${getInitialColor(index)} rounded-full flex items-center justify-center`}>
                      <span className="text-white text-sm font-semibold">
                        {getInitials(member.user.displayName)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{member.user.displayName}</div>
                      <div className="text-sm text-gray-500">
                        {member.userId === CURRENT_USER_ID ? 'Vous' : 'Coéquipier'}
                      </div>
                    </div>
                    <div className="text-sm text-secondary">
                      <CheckCircle className="inline w-4 h-4 mr-1" />
                      Connecté
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Team Challenge */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Défi d'équipe</h3>
                  <p className="text-gray-600">3 points par membre ({team.members.length * 3} points total)</p>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Organiser un pique-nique collaboratif au Phare des Baleines
                </h4>
                <p className="text-gray-600 mb-4">
                  En équipe, organisez et réalisez un pique-nique au coucher du soleil près du Phare des Baleines. 
                  Chaque membre doit apporter un élément différent (nourriture, boisson, accessoire). 
                  Documentez l'événement avec photos et vidéo.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <Utensils className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">Collaboration</div>
                    <div className="text-xs text-gray-500">requise</div>
                  </div>
                  <div className="text-center">
                    <Camera className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">Documentation</div>
                    <div className="text-xs text-gray-500">photos + vidéo</div>
                  </div>
                  <div className="text-center">
                    <Sun className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">Coucher soleil</div>
                    <div className="text-xs text-gray-500">timing</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Progression du défi</span>
                  <span className="text-sm text-gray-500">En attente</span>
                </div>
                
                <Button className="w-full bg-purple-600 text-white hover:bg-purple-700">
                  <Play className="w-4 h-4 mr-2" />
                  Commencer le défi d'équipe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <FileUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        teamId={team.id}
        userId={CURRENT_USER_ID}
      />
    </div>
  );
}
