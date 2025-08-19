import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { z } from "zod";
import { insertProofSchema, insertAuditLogSchema, insertChallengeSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/webp',
      'video/mp4', 'video/webm',
      'audio/mpeg', 'audio/wav', 'audio/webm'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/user/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { username, password, displayName, isAdmin = false } = req.body;
      if (!username || !password || !displayName) {
        return res.status(400).json({ message: "Tous les champs sont requis" });
      }

      const user = await storage.createUser({
        username,
        password, // In real app, this would be hashed
        displayName,
        isAdmin,
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de l'utilisateur" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression" });
    }
  });

  // Challenge routes
  app.get("/api/challenges", async (req, res) => {
    try {
      const challenges = await storage.getAllChallenges();
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Assignment routes
  app.get("/api/assignments/:userId", async (req, res) => {
    try {
      const assignments = await storage.getAssignmentsByUserId(req.params.userId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/assignments/generate", async (req, res) => {
    try {
      const { adminId } = req.body;
      if (!adminId) {
        return res.status(400).json({ message: "ID administrateur requis" });
      }

      const seedRecord = await storage.generateAssignments(adminId);
      res.json({ 
        message: "Assignations générées avec succès",
        seedHash: seedRecord.seedHash,
        participantCount: seedRecord.participantCount
      });
    } catch (error) {
      console.error('Error generating assignments:', error);
      res.status(500).json({ message: "Erreur lors de la génération des assignations" });
    }
  });

  // Team routes
  app.get("/api/team/:userId", async (req, res) => {
    try {
      const team = await storage.getTeamByUserId(req.params.userId);
      if (!team) {
        return res.status(404).json({ message: "Équipe non trouvée" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/team/:teamId/validate-mission", async (req, res) => {
    try {
      const { teamId } = req.params;
      const { adminId } = req.body;

      await storage.validateTeamMission(teamId);
      
      // Log audit entry
      await storage.createAuditLogEntry({
        action: 'validate_team_mission',
        adminId,
        details: `Mission d'identification validée pour l'équipe ${teamId}`,
      });

      res.json({ message: "Mission d'équipe validée avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la validation" });
    }
  });

  // Proof routes
  app.post("/api/proofs", upload.single('file'), async (req, res) => {
    try {
      const proofData = JSON.parse(req.body.proofData || '{}');
      const schema = insertProofSchema.extend({
        metadata: z.any().optional(),
      });

      const validatedData = schema.parse({
        ...proofData,
        fileName: req.file?.originalname,
        filePath: req.file?.path,
      });

      const proof = await storage.createProof(validatedData);
      res.json(proof);
    } catch (error) {
      console.error('Error creating proof:', error);
      res.status(400).json({ message: "Erreur lors de la soumission de la preuve" });
    }
  });

  app.get("/api/proofs/assignment/:assignmentId", async (req, res) => {
    try {
      const proofs = await storage.getProofsByAssignmentId(req.params.assignmentId);
      res.json(proofs);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/proofs/team/:teamId", async (req, res) => {
    try {
      const proofs = await storage.getProofsByTeamId(req.params.teamId);
      res.json(proofs);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.patch("/api/proofs/:proofId/validate", async (req, res) => {
    try {
      const { validatorId } = req.body;
      await storage.validateProof(req.params.proofId, validatorId);
      res.json({ message: "Preuve validée avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la validation" });
    }
  });

  // Assignment status updates
  app.patch("/api/assignments/:assignmentId/status", async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateAssignmentStatus(req.params.assignmentId, status);
      res.json({ message: "Statut mis à jour avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour" });
    }
  });

  // Seed verification routes
  app.get("/api/seed/current", async (req, res) => {
    try {
      const seed = await storage.getCurrentSeed();
      if (!seed) {
        return res.status(404).json({ message: "Aucun seed actif" });
      }
      res.json({
        seedHash: seed.seedHash,
        participantCount: seed.participantCount,
        generatedAt: seed.generatedAt,
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/seed/verify", async (req, res) => {
    try {
      const { seedHash } = req.body;
      const isValid = await storage.verifySeed(seedHash);
      res.json({ isValid });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la vérification" });
    }
  });

  // Audit routes
  app.get("/api/audit", async (req, res) => {
    try {
      const auditEntries = await storage.getAuditLog();
      res.json(auditEntries);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/challenges", async (req, res) => {
    try {
      const schema = insertChallengeSchema;
      const validatedData = schema.parse(req.body);
      const challenge = await storage.createChallenge(validatedData);
      res.json(challenge);
    } catch (error) {
      console.error('Error creating challenge:', error);
      res.status(400).json({ message: "Données de défi invalides" });
    }
  });

  app.post("/api/audit", async (req, res) => {
    try {
      const schema = insertAuditLogSchema;
      const validatedData = schema.parse(req.body);
      const entry = await storage.createAuditLogEntry(validatedData);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ message: "Données d'audit invalides" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
