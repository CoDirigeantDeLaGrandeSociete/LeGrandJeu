# Overview

This is a modern web application built for a challenge-based team competition system. The application appears to be designed for organizing team-based challenges where participants can complete tasks, submit proofs, and track their progress. It features a full-stack architecture with a React frontend, Express backend, and PostgreSQL database using Drizzle ORM for data management.

The system supports individual and team challenges, file uploads for proof submission, administrative functions for managing competitions, and comprehensive audit logging for transparency and security.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client is built using React 18 with TypeScript and follows a component-based architecture:

- **UI Framework**: Uses shadcn/ui components built on Radix UI primitives for consistent, accessible design
- **Styling**: Tailwind CSS with CSS variables for theming, supporting both light and dark modes
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds
- **File Structure**: Organized with clear separation between pages, components, hooks, and utilities

## Backend Architecture

The server uses Express.js with TypeScript in an ESM module setup:

- **Framework**: Express.js for the REST API server
- **Database Integration**: Drizzle ORM with Neon PostgreSQL serverless database
- **File Handling**: Multer middleware for handling file uploads with type restrictions
- **Development**: Custom Vite integration for development mode with HMR support
- **Error Handling**: Centralized error handling middleware
- **Logging**: Custom request/response logging for API endpoints

## Data Storage Solutions

The application uses a PostgreSQL database with a well-structured schema:

- **ORM**: Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL
- **Schema Organization**: Centralized schema definitions in the shared directory
- **Key Entities**: Users, challenges, teams, assignments, proofs, and audit logs
- **Enums**: PostgreSQL enums for challenge difficulty, status, proof types, and audit actions
- **Relationships**: Proper foreign key relationships between entities

## Authentication and Authorization

The current implementation uses a simplified authentication model:

- **User Management**: Basic user structure with admin role support
- **Session Handling**: Placeholder for session management (connect-pg-simple dependency suggests PostgreSQL sessions)
- **Role-Based Access**: Admin vs regular user permissions for different features

## File Upload System

Robust file handling system for proof submissions:

- **Storage**: Local file system storage via Multer
- **File Types**: Support for images (JPEG, PNG, WebP), videos (MP4, WebM), and audio (MP3, WAV, WebM)
- **Size Limits**: 10MB maximum file size restriction
- **Metadata**: Geolocation and timestamp support for submitted proofs
- **Validation**: Comprehensive file type and size validation

## Assignment Generation System

Sophisticated challenge assignment system:

- **Seed-Based Generation**: Uses cryptographic seeds for reproducible assignment generation
- **Audit Trail**: Complete audit logging of assignment generation and validation
- **Team Formation**: Automatic team creation and mission assignment
- **Challenge Distribution**: Intelligent distribution of challenges across difficulty levels

## Key Design Patterns

- **Shared Types**: Common TypeScript types and schema definitions shared between frontend and backend
- **API-First Design**: RESTful API design with consistent response patterns
- **Component Composition**: Reusable UI components with proper prop interfaces
- **Custom Hooks**: Encapsulated business logic in custom React hooks
- **Environment Configuration**: Environment-based configuration for different deployment stages

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database hosting
- **Drizzle Kit**: Database migrations and schema management

## UI and Styling
- **Radix UI**: Headless UI components for accessibility and functionality
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library built on Radix UI

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing and optimization

## Runtime Libraries
- **TanStack Query**: Data fetching and caching
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and parsing
- **Wouter**: Lightweight routing solution
- **date-fns**: Date utility functions

## File Processing
- **Multer**: File upload handling
- **WebSocket**: Real-time communication support (via ws package)

## Development Environment
- **Replit Integration**: Custom plugins for Replit development environment
- **Runtime Error Handling**: Development-time error overlays and debugging tools

The application is designed to be scalable, maintainable, and follows modern web development best practices with comprehensive type safety and proper separation of concerns.