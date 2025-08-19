import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Plus,
  Star,
  Users,
  Target,
  Edit,
  Trash2
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { insertChallengeSchema, type Challenge } from '@shared/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';

const challengeFormSchema = insertChallengeSchema.extend({
  difficulty: z.enum(['easy', 'medium', 'hard', 'team']),
});

type ChallengeFormData = z.infer<typeof challengeFormSchema>;

export default function ChallengeBankPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: challenges = [], isLoading } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges'],
  });

  const form = useForm<ChallengeFormData>({
    resolver: zodResolver(challengeFormSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'easy',
      points: 1,
      needsTarget: false,
      isActive: true,
    },
  });

  const addChallenge = useMutation({
    mutationFn: async (data: ChallengeFormData) => {
      return apiRequest('POST', '/api/challenges', data);
    },
    onSuccess: () => {
      toast({
        title: 'Défi ajouté',
        description: 'Le nouveau défi a été ajouté à la banque.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      setIsAddModalOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'ajout du défi.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ChallengeFormData) => {
    // Set points based on difficulty
    const pointsMap = { easy: 1, medium: 3, hard: 5, team: 3 };
    const formData = { ...data, points: pointsMap[data.difficulty] };
    addChallenge.mutate(formData);
  };

  const getDifficultyBadge = (difficulty: string, points: number) => {
    const configs = {
      easy: { label: `Facile • ${points} pt`, className: 'bg-green-100 text-green-800', icon: <Star className="w-3 h-3" /> },
      medium: { label: `Intermédiaire • ${points} pts`, className: 'bg-blue-100 text-blue-800', icon: <><Star className="w-3 h-3" /><Star className="w-3 h-3" /></> },
      hard: { label: `Difficile • ${points} pts`, className: 'bg-red-100 text-red-800', icon: <><Star className="w-3 h-3" /><Star className="w-3 h-3" /><Star className="w-3 h-3" /></> },
      team: { label: `Équipe • ${points} pts/membre`, className: 'bg-purple-100 text-purple-800', icon: <Users className="w-3 h-3" /> }
    };

    const config = configs[difficulty as keyof typeof configs];
    return (
      <Badge className={`inline-flex items-center space-x-1 ${config.className}`}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  };

  const groupedChallenges = {
    easy: challenges.filter(c => c.difficulty === 'easy'),
    medium: challenges.filter(c => c.difficulty === 'medium'),
    hard: challenges.filter(c => c.difficulty === 'hard'),
    team: challenges.filter(c => c.difficulty === 'team'),
  };

  if (isLoading) {
    return <div className="p-6">Chargement de la banque de défis...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Banque de défis</h2>
            <p className="text-gray-600">Gestion de tous les défis disponibles pour le GJIR</p>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white hover:bg-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un défi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau défi</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre du défi</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Photo souvenir au port" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Décrivez précisément ce que les participants doivent faire..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Niveau de difficulté</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir la difficulté" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="easy">Facile (1 pt)</SelectItem>
                              <SelectItem value="medium">Intermédiaire (3 pts)</SelectItem>
                              <SelectItem value="hard">Difficile (5 pts)</SelectItem>
                              <SelectItem value="team">Équipe (3 pts/membre)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="needsTarget"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Cible requise</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Ce défi nécessite une autre personne
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button 
                      type="submit" 
                      disabled={addChallenge.isPending}
                      className="flex-1 bg-primary text-white hover:bg-blue-600"
                    >
                      {addChallenge.isPending ? 'Ajout...' : 'Ajouter le défi'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Challenge Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{groupedChallenges.easy.length}</div>
            <div className="text-sm text-gray-600">Défis faciles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{groupedChallenges.medium.length}</div>
            <div className="text-sm text-gray-600">Défis intermédiaires</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{groupedChallenges.hard.length}</div>
            <div className="text-sm text-gray-600">Défis difficiles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{groupedChallenges.team.length}</div>
            <div className="text-sm text-gray-600">Défis d'équipe</div>
          </CardContent>
        </Card>
      </div>

      {/* Challenge Lists by Difficulty */}
      {Object.entries(groupedChallenges).map(([difficulty, challengeList]) => (
        <div key={difficulty} className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 capitalize">
            Défis {difficulty === 'easy' ? 'faciles' : 
                   difficulty === 'medium' ? 'intermédiaires' :
                   difficulty === 'hard' ? 'difficiles' : 'd\'équipe'}
            <span className="text-gray-500 text-base font-normal ml-2">({challengeList.length})</span>
          </h3>
          
          <div className="grid gap-4">
            {challengeList.map((challenge) => (
              <Card key={challenge.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getDifficultyBadge(challenge.difficulty, challenge.points)}
                      {challenge.needsTarget && (
                        <Badge className="bg-orange-100 text-orange-800">
                          <Target className="w-3 h-3 mr-1" />
                          Cible requise
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{challenge.title}</h4>
                  <p className="text-gray-600 mb-4">{challenge.description}</p>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}