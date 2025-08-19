import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CloudUpload, File, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { FileUploadData } from '@/lib/types';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId?: string;
  teamId?: string;
  userId: string;
}

export function FileUploadModal({ isOpen, onClose, assignmentId, teamId, userId }: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [includeLocation, setIncludeLocation] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitProof = useMutation({
    mutationFn: async (data: FileUploadData) => {
      const formData = new FormData();
      
      if (data.file) {
        formData.append('file', data.file);
      }
      
      const proofData = {
        userId,
        assignmentId,
        teamId,
        type: data.file?.type.startsWith('image/') ? 'photo' : 
              data.file?.type.startsWith('video/') ? 'video' :
              data.file?.type.startsWith('audio/') ? 'audio' : 'text',
        description: data.description,
        metadata: data.metadata,
      };
      
      formData.append('proofData', JSON.stringify(proofData));
      
      return apiRequest('POST', '/api/proofs', formData);
    },
    onSuccess: () => {
      toast({
        title: 'Preuve soumise',
        description: 'Votre preuve a été soumise avec succès.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/team', userId] });
      handleClose();
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la soumission de la preuve.',
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier.',
        variant: 'destructive',
      });
      return;
    }

    let metadata = {};
    
    if (includeLocation && navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        metadata = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.warn('Could not get location:', error);
        metadata = {
          timestamp: new Date().toISOString(),
        };
      }
    } else {
      metadata = {
        timestamp: new Date().toISOString(),
      };
    }

    submitProof.mutate({
      file: selectedFile,
      description,
      includeLocation,
      metadata,
    });
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDescription('');
    setIncludeLocation(true);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Soumettre une preuve</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File upload area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <>
                <File className="h-12 w-12 text-primary mx-auto mb-2" />
                <p className="text-gray-900 mb-1">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">Fichier sélectionné</p>
              </>
            ) : (
              <>
                <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-1">Cliquez pour choisir un fichier</p>
                <p className="text-xs text-gray-500">Photo, audio ou autre preuve (max 10MB)</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,audio/*,video/*"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
          </div>
          
          {/* Location toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-location"
              checked={includeLocation}
              onCheckedChange={(checked) => setIncludeLocation(!!checked)}
            />
            <Label htmlFor="include-location" className="text-sm text-gray-700">
              Inclure la géolocalisation
            </Label>
          </div>
          
          {/* Description */}
          <div>
            <Label htmlFor="proof-description" className="text-sm font-medium text-gray-700 mb-2">
              Description (optionnelle)
            </Label>
            <Textarea
              id="proof-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre preuve..."
              rows={3}
            />
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={handleSubmit}
              disabled={!selectedFile || submitProof.isPending}
              className="flex-1 bg-primary text-white hover:bg-blue-600"
            >
              <CloudUpload className="w-4 h-4 mr-2" />
              {submitProof.isPending ? 'Envoi...' : 'Soumettre'}
            </Button>
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
