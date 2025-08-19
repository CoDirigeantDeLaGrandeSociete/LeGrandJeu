export interface ChallengeStats {
  completed: number;
  total: number;
  points: number;
  potentialPoints: number;
}

export interface TeamMissionStatus {
  status: 'pending' | 'in_progress' | 'validated';
  proofsSubmitted: number;
  proofsRequired: number;
}

export interface FileUploadData {
  file?: File;
  description?: string;
  includeLocation: boolean;
  metadata?: {
    latitude?: number;
    longitude?: number;
    timestamp?: string;
  };
}

export interface SystemStats {
  totalParticipants: number;
  teamsFormed: number;
  missionsValidated: number;
  challengesCompleted: number;
  easyChallenges: number;
  mediumChallenges: number;
  hardChallenges: number;
  teamChallenges: number;
}
