# SmartOps - Machine Management & Analytics Platform

## Overview

SmartOps is a comprehensive full-stack web application for managing industrial laundry equipment across multiple locations. Built with a modern React frontend and Express.js backend, the application provides real-time monitoring, analytics, and reporting capabilities for machine performance, maintenance, and operational efficiency.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Components**: Radix UI with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Charts & Visualizations**: Nivo library for data visualization
- **Build Tool**: Vite for development and building

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and express-session
- **API Design**: RESTful API with role-based access control
- **Real-time Features**: WebSocket support for live updates

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Connection Pooling**: @neondatabase/serverless with WebSocket support
- **Migrations**: Drizzle Kit for schema management
- **Session Storage**: In-memory store with memorystore

## Key Components

### Authentication & Authorization
- Multi-role user system (admin, manager, operator, various analysts)
- Session-based authentication with secure cookies
- Role-based middleware for API endpoint protection
- Password hashing with bcrypt

### Machine Management
- Real-time machine status monitoring
- Machine lifecycle tracking and warranty management
- Performance metrics collection and analysis
- Error tracking and persistent error monitoring
- Machine comparison and analytics

### Location & Asset Management
- Multi-location support with hierarchical organization
- Location-specific user assignments
- Machine inventory per location
- Geographic distribution analytics

### Alerting & Monitoring
- Service alert system with severity levels
- Machine error tracking with persistence monitoring
- Alert filtering and search capabilities
- Real-time alert notifications

### Reporting & Analytics
- Executive dashboards with KPI metrics
- Machine performance analytics
- Sustainability reporting (energy, water, carbon footprint)
- Scheduled email reports with configurable recipients
- Historical data export capabilities

### External Integrations
- SQ Insights API synchronization for machine data
- SendGrid integration for email notifications
- Scheduled data synchronization with external systems

## Data Flow

1. **Data Ingestion**: External machine data synced from SQ Insights API
2. **Real-time Processing**: Machine status and alerts processed in real-time
3. **Storage**: All data persisted in PostgreSQL with proper relationships
4. **API Layer**: RESTful endpoints serve processed data to frontend
5. **Visualization**: React components render charts and dashboards
6. **Notifications**: Email alerts sent via SendGrid for critical events

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL (Neon serverless)
- **Email Service**: SendGrid for transactional emails
- **External API**: SQ Insights for machine data synchronization

### Development Tools
- **ORM**: Drizzle with PostgreSQL dialect
- **Build Tools**: Vite, ESBuild for production builds
- **Development**: tsx for TypeScript execution
- **Styling**: Tailwind CSS with custom theme

### Third-party Services
- **Charts**: Nivo library for data visualizations
- **UI Components**: Radix UI primitives
- **Date Handling**: date-fns for date manipulation
- **Forms**: React Hook Form with Zod validation

## Deployment Strategy

### Platform
- **Primary**: Replit with Cloud Run deployment target
- **Environment**: Node.js 20 with PostgreSQL 16
- **Port Configuration**: Internal port 5000, external port 80

### Build Process
1. Frontend build using Vite (outputs to `dist/public`)
2. Backend bundle using ESBuild (outputs to `dist/index.js`)
3. Production deployment runs bundled Node.js application

### Environment Configuration
- **Development**: `npm run dev` - uses tsx for TypeScript execution
- **Production**: `npm run start` - runs compiled JavaScript bundle
- **Database**: Automatic provisioning through Replit PostgreSQL module

### Monitoring & Maintenance
- Sync logs tracking for data synchronization health
- Error tracking and persistent error monitoring
- Performance metrics collection for optimization
- Automated email reporting for operational insights

## Changelog

Changelog:
- June 16, 2025. Initial setup
- June 16, 2025. Added comprehensive AUDIT_OPERATION database table and API system with Location ID and Machine ID fields
- June 16, 2025. Successfully processed machine performance audit data into structured audit operations with intelligent analysis and compliance tracking

## User Preferences

Preferred communication style: Simple, everyday language.