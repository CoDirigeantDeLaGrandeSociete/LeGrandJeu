import {
  users,
  challenges,
  teams,
  teamMembers,
  assignments,
  assignmentSeeds,
  proofs,
  auditLog,
  type User,
  type InsertUser,
  type Challenge,
  type InsertChallenge,
  type Team,
  type InsertTeam,
  type TeamMember,
  type Assignment,
  type InsertAssignment,
  type AssignmentSeed,
  type Proof,
  type InsertProof,
  type AuditLogEntry,
  type InsertAuditLogEntry,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;

  // Challenge operations
  getAllChallenges(): Promise<Challenge[]>;
  getChallengesByDifficulty(difficulty: string): Promise<Challenge[]>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;

  // Team operations
  getTeamByUserId(userId: string): Promise<(Team & { members: (TeamMember & { user: User })[] }) | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  addTeamMember(teamId: string, userId: string): Promise<TeamMember>;
  validateTeamMission(teamId: string): Promise<void>;

  // Assignment operations
  getAssignmentsByUserId(userId: string): Promise<(Assignment & { challenge: Challenge; targetUser?: User })[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignmentStatus(assignmentId: string, status: string): Promise<void>;
  generateAssignments(adminId: string): Promise<AssignmentSeed>;
  getCurrentSeed(): Promise<AssignmentSeed | undefined>;

  // Proof operations
  createProof(proof: InsertProof): Promise<Proof>;
  getProofsByAssignmentId(assignmentId: string): Promise<Proof[]>;
  getProofsByTeamId(teamId: string): Promise<Proof[]>;
  validateProof(proofId: string, validatorId: string): Promise<void>;

  // Audit operations
  createAuditLogEntry(entry: InsertAuditLogEntry): Promise<AuditLogEntry>;
  getAuditLog(): Promise<AuditLogEntry[]>;
  verifySeed(seedHash: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllChallenges(): Promise<Challenge[]> {
    return await db.select().from(challenges).where(eq(challenges.isActive, true));
  }

  async getChallengesByDifficulty(difficulty: string): Promise<Challenge[]> {
    return await db
      .select()
      .from(challenges)
      .where(and(eq(challenges.difficulty, difficulty as any), eq(challenges.isActive, true)));
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const [newChallenge] = await db.insert(challenges).values(challenge).returning();
    return newChallenge;
  }

  async getTeamByUserId(userId: string): Promise<(Team & { members: (TeamMember & { user: User })[] }) | undefined> {
    const teamMember = await db
      .select({
        team: teams,
        member: teamMembers,
        user: users,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.userId, userId));

    if (teamMember.length === 0) return undefined;

    const team = teamMember[0].team;
    const allMembers = await db
      .select({
        member: teamMembers,
        user: users,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, team.id));

    return {
      ...team,
      members: allMembers.map(m => ({ ...m.member, user: m.user })),
    };
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async addTeamMember(teamId: string, userId: string): Promise<TeamMember> {
    const [member] = await db.insert(teamMembers).values({ teamId, userId }).returning();
    return member;
  }

  async validateTeamMission(teamId: string): Promise<void> {
    await db
      .update(teams)
      .set({ identificationMissionValidated: true })
      .where(eq(teams.id, teamId));
  }

  async getAssignmentsByUserId(userId: string): Promise<(Assignment & { challenge: Challenge; targetUser?: User })[]> {
    const result = await db
      .select({
        assignment: assignments,
        challenge: challenges,
        targetUser: users,
      })
      .from(assignments)
      .innerJoin(challenges, eq(assignments.challengeId, challenges.id))
      .leftJoin(users, eq(assignments.targetUserId, users.id))
      .where(eq(assignments.userId, userId));

    return result.map(r => ({
      ...r.assignment,
      challenge: r.challenge,
      targetUser: r.targetUser || undefined,
    }));
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db.insert(assignments).values(assignment).returning();
    return newAssignment;
  }

  async updateAssignmentStatus(assignmentId: string, status: string): Promise<void> {
    await db
      .update(assignments)
      .set({ status: status as any })
      .where(eq(assignments.id, assignmentId));
  }

  async generateAssignments(adminId: string): Promise<AssignmentSeed> {
    // Generate cryptographic seed
    const seed = randomBytes(128).toString('hex');
    const seedHash = createHash('sha256').update(seed).digest('hex');

    // Get all users and challenges
    const allUsers = await db.select().from(users).where(eq(users.isAdmin, false));
    const easyChallenges = await this.getChallengesByDifficulty('easy');
    const mediumChallenges = await this.getChallengesByDifficulty('medium');
    const hardChallenges = await this.getChallengesByDifficulty('hard');
    const teamChallenges = await this.getChallengesByDifficulty('team');

    // Clear existing assignments
    await db.delete(assignments);
    await db.delete(teamMembers);
    await db.delete(teams);
    await db.update(assignmentSeeds).set({ isActive: false });

    // Create new seed record
    const [seedRecord] = await db.insert(assignmentSeeds).values({
      seed,
      seedHash,
      participantCount: allUsers.length,
      generatedBy: adminId,
      isActive: true,
    }).returning();

    // Seed random number generator for deterministic assignment
    let seedIndex = 0;
    const seededRandom = () => {
      const value = parseInt(seed.substr(seedIndex % seed.length, 8), 16) / 0xffffffff;
      seedIndex += 8;
      return value;
    };

    // Shuffle users deterministically
    const shuffledUsers = [...allUsers];
    for (let i = shuffledUsers.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [shuffledUsers[i], shuffledUsers[j]] = [shuffledUsers[j], shuffledUsers[i]];
    }

    // Form teams (2-3 members each)
    const teamAssignments: string[][] = [];
    let currentTeamIndex = 0;
    
    for (let i = 0; i < shuffledUsers.length; i += 3) {
      const teamSize = Math.min(3, shuffledUsers.length - i);
      const teamMembers = shuffledUsers.slice(i, i + teamSize);
      teamAssignments.push(teamMembers.map(u => u.id));
    }

    // Create teams with identification missions
    const identificationMissions = [
      {
        title: "Retrouvez-vous au marché de Saint-Martin",
        description: "Rendez-vous ensemble au marché de Saint-Martin-de-Ré entre 9h et 11h. Prenez une photo de groupe devant l'entrée principale."
      },
      {
        title: "Rassemblement au Phare des Baleines",
        description: "Retrouvez-vous tous au pied du Phare des Baleines. Prenez une photo de groupe avec le phare en arrière-plan."
      },
      {
        title: "Réunion à la Plage de la Conche",
        description: "Rendez-vous sur la plage de la Conche des Baleines. Prenez une photo de groupe sur le sable."
      }
    ];

    for (let i = 0; i < teamAssignments.length; i++) {
      const missionIndex = Math.floor(seededRandom() * identificationMissions.length);
      const mission = identificationMissions[missionIndex];
      const teamChallengeIndex = Math.floor(seededRandom() * teamChallenges.length);
      const teamChallenge = teamChallenges[teamChallengeIndex];

      const [team] = await db.insert(teams).values({
        name: `Équipe #${i + 1}`,
        identificationMissionTitle: mission.title,
        identificationMissionDescription: mission.description,
        teamChallengeId: teamChallenge.id,
      }).returning();

      // Add team members
      for (const userId of teamAssignments[i]) {
        await this.addTeamMember(team.id, userId);
      }
    }

    // Assign individual challenges
    for (const user of allUsers) {
      // 2 easy challenges
      const userEasyChallenges = [...easyChallenges].sort(() => seededRandom() - 0.5).slice(0, 2);
      for (const challenge of userEasyChallenges) {
        await this.createAssignment({
          userId: user.id,
          challengeId: challenge.id,
          status: 'not_started',
        });
      }

      // 2 medium challenges
      const userMediumChallenges = [...mediumChallenges].sort(() => seededRandom() - 0.5).slice(0, 2);
      for (const challenge of userMediumChallenges) {
        let targetUserId: string | undefined = undefined;
        if (challenge.needsTarget) {
          const possibleTargets = allUsers.filter(u => u.id !== user.id);
          targetUserId = possibleTargets[Math.floor(seededRandom() * possibleTargets.length)].id;
        }
        
        await this.createAssignment({
          userId: user.id,
          challengeId: challenge.id,
          targetUserId,
          status: 'not_started',
        });
      }

      // 2 hard challenges
      const userHardChallenges = [...hardChallenges].sort(() => seededRandom() - 0.5).slice(0, 2);
      for (const challenge of userHardChallenges) {
        let targetUserId: string | undefined = undefined;
        if (challenge.needsTarget) {
          const possibleTargets = allUsers.filter(u => u.id !== user.id);
          targetUserId = possibleTargets[Math.floor(seededRandom() * possibleTargets.length)].id;
        }
        
        await this.createAssignment({
          userId: user.id,
          challengeId: challenge.id,
          targetUserId,
          status: 'not_started',
        });
      }
    }

    // Log audit entry
    await this.createAuditLogEntry({
      action: 'generate_assignments',
      adminId,
      details: `Assignations générées pour ${allUsers.length} participants`,
      seedHash,
    });

    return seedRecord;
  }

  async getCurrentSeed(): Promise<AssignmentSeed | undefined> {
    const [seed] = await db
      .select()
      .from(assignmentSeeds)
      .where(eq(assignmentSeeds.isActive, true))
      .orderBy(desc(assignmentSeeds.generatedAt))
      .limit(1);
    return seed || undefined;
  }

  async createProof(proof: InsertProof): Promise<Proof> {
    const [newProof] = await db.insert(proofs).values(proof).returning();
    return newProof;
  }

  async getProofsByAssignmentId(assignmentId: string): Promise<Proof[]> {
    return await db.select().from(proofs).where(eq(proofs.assignmentId, assignmentId));
  }

  async getProofsByTeamId(teamId: string): Promise<Proof[]> {
    return await db.select().from(proofs).where(eq(proofs.teamId, teamId));
  }

  async validateProof(proofId: string, validatorId: string): Promise<void> {
    await db
      .update(proofs)
      .set({
        isValidated: true,
        validatedBy: validatorId,
        validatedAt: sql`now()`,
      })
      .where(eq(proofs.id, proofId));
  }

  async createAuditLogEntry(entry: InsertAuditLogEntry): Promise<AuditLogEntry> {
    const [logEntry] = await db.insert(auditLog).values(entry).returning();
    return logEntry;
  }

  async getAuditLog(): Promise<AuditLogEntry[]> {
    return await db
      .select()
      .from(auditLog)
      .orderBy(desc(auditLog.timestamp));
  }

  async verifySeed(seedHash: string): Promise<boolean> {
    const [seed] = await db
      .select()
      .from(assignmentSeeds)
      .where(eq(assignmentSeeds.seedHash, seedHash));
    return !!seed;
  }
}

export const storage = new DatabaseStorage();
