import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const challengeDifficultyEnum = pgEnum("challenge_difficulty", ["easy", "medium", "hard", "team"]);
export const challengeStatusEnum = pgEnum("challenge_status", ["not_started", "in_progress", "completed", "validated"]);
export const proofTypeEnum = pgEnum("proof_type", ["photo", "video", "audio", "text", "geolocation"]);
export const auditActionEnum = pgEnum("audit_action", ["generate_assignments", "validate_team_mission", "regenerate_assignments", "verify_seed"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Challenges table
export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: challengeDifficultyEnum("difficulty").notNull(),
  points: integer("points").notNull(),
  needsTarget: boolean("needs_target").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Teams table
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  identificationMissionTitle: text("identification_mission_title").notNull(),
  identificationMissionDescription: text("identification_mission_description").notNull(),
  identificationMissionValidated: boolean("identification_mission_validated").default(false).notNull(),
  teamChallengeId: varchar("team_challenge_id").references(() => challenges.id),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Team members table
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").references(() => teams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").default(sql`now()`).notNull(),
});

// Assignments table
export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  challengeId: varchar("challenge_id").references(() => challenges.id).notNull(),
  targetUserId: varchar("target_user_id").references(() => users.id),
  status: challengeStatusEnum("status").default("not_started").notNull(),
  assignedAt: timestamp("assigned_at").default(sql`now()`).notNull(),
  completedAt: timestamp("completed_at"),
  validatedAt: timestamp("validated_at"),
});

// Assignment seeds table (for cryptographic verification)
export const assignmentSeeds = pgTable("assignment_seeds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seed: text("seed").notNull(),
  seedHash: text("seed_hash").notNull(),
  participantCount: integer("participant_count").notNull(),
  generatedBy: varchar("generated_by").references(() => users.id).notNull(),
  generatedAt: timestamp("generated_at").default(sql`now()`).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Proofs table
export const proofs = pgTable("proofs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  assignmentId: varchar("assignment_id").references(() => assignments.id),
  teamId: varchar("team_id").references(() => teams.id),
  type: proofTypeEnum("type").notNull(),
  fileName: text("file_name"),
  filePath: text("file_path"),
  description: text("description"),
  metadata: jsonb("metadata"), // For geolocation, timestamp, etc.
  isValidated: boolean("is_validated").default(false).notNull(),
  validatedBy: varchar("validated_by").references(() => users.id),
  validatedAt: timestamp("validated_at"),
  submittedAt: timestamp("submitted_at").default(sql`now()`).notNull(),
});

// Audit log table
export const auditLog = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: auditActionEnum("action").notNull(),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  details: text("details").notNull(),
  seedHash: text("seed_hash"),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").default(sql`now()`).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignments: many(assignments),
  teamMemberships: many(teamMembers),
  proofsSubmitted: many(proofs),
  auditActions: many(auditLog),
}));

export const challengesRelations = relations(challenges, ({ many }) => ({
  assignments: many(assignments),
  teamsUsingThis: many(teams),
}));

export const teamsRelations = relations(teams, ({ many, one }) => ({
  members: many(teamMembers),
  proofs: many(proofs),
  teamChallenge: one(challenges, {
    fields: [teams.teamChallengeId],
    references: [challenges.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  user: one(users, {
    fields: [assignments.userId],
    references: [users.id],
  }),
  challenge: one(challenges, {
    fields: [assignments.challengeId],
    references: [challenges.id],
  }),
  targetUser: one(users, {
    fields: [assignments.targetUserId],
    references: [users.id],
  }),
  proofs: many(proofs),
}));

export const proofsRelations = relations(proofs, ({ one }) => ({
  user: one(users, {
    fields: [proofs.userId],
    references: [users.id],
  }),
  assignment: one(assignments, {
    fields: [proofs.assignmentId],
    references: [assignments.id],
  }),
  team: one(teams, {
    fields: [proofs.teamId],
    references: [teams.id],
  }),
  validator: one(users, {
    fields: [proofs.validatedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  assignedAt: true,
  completedAt: true,
  validatedAt: true,
});

export const insertProofSchema = createInsertSchema(proofs).omit({
  id: true,
  submittedAt: true,
  validatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type TeamMember = typeof teamMembers.$inferSelect;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type AssignmentSeed = typeof assignmentSeeds.$inferSelect;

export type Proof = typeof proofs.$inferSelect;
export type InsertProof = z.infer<typeof insertProofSchema>;

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type InsertAuditLogEntry = z.infer<typeof insertAuditLogSchema>;
