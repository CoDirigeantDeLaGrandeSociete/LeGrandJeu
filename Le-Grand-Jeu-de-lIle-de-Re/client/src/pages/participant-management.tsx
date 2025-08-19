import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus,
  Mail,
  Users,
  Trash2,
  UserCheck
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { insertUserSchema, type User } from '@shared/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';

const participantFormSchema = insertUserSchema.extend({
  email: z.string().email('Adresse email invalide'),
});

type ParticipantFormData = z.infer<typeof participantFormSchema>;

export default function ParticipantManagementPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const form = useForm<ParticipantFormData>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: {
      username: '',
      password: '',
      displayName: '',
      email: '',
      isAdmin: false,
    },
  });

  const addParticipant = useMutation({
    mutationFn: async (data: ParticipantFormData) => {
      // Generate username from email
      const username = data.email.split('@')[0];
      // Generate default password (in real app, this would be more secure)
      const password = 'gjir2024';
      
      const userData = {
        username,
        password,
        displayName: data.displayName,
        isAdmin: false,
      };
      
      return apiRequest('POST', '/api/users', userData);
    },
    onSuccess: () => {
      toast({
        title: 'Participant ajouté',
        description: 'Le nouveau participant a été ajouté avec succès.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsAddModalOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'ajout du participant.',
        variant: 'destructive',
      });
    },
  });

  const deleteParticipant = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Participant supprimé',
        description: 'Le participant a été supprimé avec succès.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression du participant.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ParticipantFormData) => {
    addParticipant.mutate(data);
  };

  const participants = users.filter(user => !user.isAdmin);
  const admins = users.filter(user => user.isAdmin);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return <div className="p-6">Chargement des participants...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Gestion des participants</h2>
            <p className="text-gray-600">Ajouter et gérer les participants du GJIR</p>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white hover:bg-blue-600">
                <UserPlus className="w-4 h-4 mr-2" />
                Ajouter un participant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau participant</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input 
                              placeholder="participant@example.com" 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Jean Dupont" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-sm text-blue-800">
                      <strong>Informations de connexion :</strong><br />
                      • Nom d'utilisateur : généré automatiquement depuis l'email<br />
                      • Mot de passe temporaire : <code className="bg-blue-100 px-1 rounded">gjir2024</code>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button 
                      type="submit" 
                      disabled={addParticipant.isPending}
                      className="flex-1 bg-primary text-white hover:bg-blue-600"
                    >
                      {addParticipant.isPending ? 'Ajout...' : 'Ajouter'}
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

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">{participants.length}</div>
            <div className="text-sm text-gray-600">Participants</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-secondary mb-2">{admins.length}</div>
            <div className="text-sm text-gray-600">Administrateurs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-accent mb-2">{users.length}</div>
            <div className="text-sm text-gray-600">Total utilisateurs</div>
          </CardContent>
        </Card>
      </div>

      {/* Participants List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Liste des participants</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {participants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun participant enregistré
              </div>
            ) : (
              participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {getInitials(participant.displayName)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{participant.displayName}</div>
                      <div className="text-sm text-gray-500">@{participant.username}</div>
                      <div className="text-xs text-gray-400">
                        Inscrit le {new Date(participant.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-green-100 text-green-800">
                      <UserCheck className="w-3 h-3 mr-1" />
                      Actif
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteParticipant.mutate(participant.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}