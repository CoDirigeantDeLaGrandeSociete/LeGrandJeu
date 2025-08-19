import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  CheckCircle, 
  Clock, 
  Pause, 
  Play, 
  Camera, 
  Users, 
  MapPin, 
  Info 
} from 'lucide-react';
import type { Assignment, Challenge, User } from '@shared/schema';

interface ChallengeCardProps {
  assignment: Assignment & { challenge: Challenge; targetUser?: User };
  onUploadProof: (assignmentId: string) => void;
  onStartChallenge: (assignmentId: string) => void;
}

export function ChallengeCard({ assignment, onUploadProof, onStartChallenge }: ChallengeCardProps) {
  const { challenge, targetUser, status } = assignment;

  const getDifficultyBadge = () => {
    const configs = {
      easy: { label: 'Facile • 1 pt', icon: <Star className="w-3 h-3" />, variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      medium: { label: 'Intermédiaire • 3 pts', icon: <><Star className="w-3 h-3" /><Star className="w-3 h-3" /></>, variant: 'default' as const, className: 'bg-blue-100 text-blue-800' },
      hard: { label: 'Difficile • 5 pts', icon: <><Star className="w-3 h-3" /><Star className="w-3 h-3" /><Star className="w-3 h-3" /></>, variant: 'default' as const, className: 'bg-red-100 text-red-800' },
      team: { label: 'Équipe • 3 pts/membre', icon: <Users className="w-3 h-3" />, variant: 'default' as const, className: 'bg-purple-100 text-purple-800' }
    };

    const config = configs[challenge.difficulty];
    return (
      <Badge variant={config.variant} className={`inline-flex items-center space-x-1 ${config.className}`}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  };

  const getStatusBadge = () => {
    const configs = {
      not_started: { label: 'Pas commencé', icon: <Pause className="w-3 h-3" />, className: 'bg-gray-100 text-gray-800' },
      in_progress: { label: 'En cours', icon: <Clock className="w-3 h-3" />, className: 'bg-amber-100 text-amber-800' },
      completed: { label: 'Terminé', icon: <CheckCircle className="w-3 h-3" />, className: 'bg-blue-100 text-blue-800' },
      validated: { label: 'Validé', icon: <CheckCircle className="w-3 h-3" />, className: 'bg-green-100 text-green-800' }
    };

    const config = configs[status];
    return (
      <Badge variant="default" className={`inline-flex items-center space-x-1 ${config.className}`}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  };

  const getProgressValue = () => {
    switch (status) {
      case 'not_started': return 0;
      case 'in_progress': return 50;
      case 'completed': return 75;
      case 'validated': return 100;
      default: return 0;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {getDifficultyBadge()}
            {getStatusBadge()}
          </div>
        </div>

        <h4 className="text-lg font-semibold text-gray-900 mb-2">{challenge.title}</h4>
        <p className="text-gray-600 mb-4">{challenge.description}</p>

        {targetUser && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>Personne cible assignée :</strong> {targetUser.displayName}<br />
                Cette personne doit valider votre accomplissement.
              </div>
            </div>
          </div>
        )}

        {status === 'in_progress' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600 mb-2">
              Progression: {getProgressValue()}%
            </div>
            <Progress value={getProgressValue()} className="mb-2" />
          </div>
        )}

        {status === 'validated' && assignment.validatedAt && (
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span>Validé le {new Date(assignment.validatedAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
        )}

        <div className="flex space-x-2">
          {status === 'not_started' && (
            <Button 
              onClick={() => onStartChallenge(assignment.id)}
              className="bg-primary text-white hover:bg-blue-600"
            >
              <Play className="w-4 h-4 mr-2" />
              Commencer le défi
            </Button>
          )}
          
          {(status === 'in_progress' || status === 'completed') && (
            <Button 
              onClick={() => onUploadProof(assignment.id)}
              className="bg-primary text-white hover:bg-blue-600"
            >
              <Camera className="w-4 h-4 mr-2" />
              Ajouter une preuve
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
