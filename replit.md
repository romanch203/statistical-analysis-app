# StatAnalyzer Pro

## Overview

StatAnalyzer Pro is a comprehensive statistical analysis platform that automates data processing, statistical analysis, and report generation. The application allows users to upload various file formats (CSV, Excel, PDF, Word, Images), performs automated statistical analysis with AI interpretation, and generates professional reports.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Architecture
This is a monorepo application using a modern full-stack architecture:
- **Frontend**: React with TypeScript, Vite build system
- **Backend**: Express.js with TypeScript 
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **State Management**: TanStack Query for server state
- **File Processing**: Multi-format file parsing and processing
- **AI Integration**: OpenAI GPT-4o for statistical interpretation

### Directory Structure
```
├── client/          # React frontend application
├── server/          # Express.js backend API
├── shared/          # Shared TypeScript schemas and types
├── migrations/      # Database migration files
└── reports/         # Generated analysis reports
```

## Key Components

### Frontend Components
- **FileUpload**: Drag-and-drop file upload with format validation
- **AnalysisProgress**: Real-time progress tracking with status updates
- **ResultsPreview**: Interactive display of statistical results and AI interpretation
- **UI Components**: Complete shadcn/ui component library for consistent design

### Backend Services
- **FileParser**: Multi-format file parsing (CSV, Excel, PDF, Word, Images)
- **StatisticalAnalysis**: Comprehensive statistical analysis engine
- **OpenAIService**: AI-powered interpretation of statistical results
- **ReportGenerator**: PDF and Word report generation
- **Storage**: Data persistence layer with in-memory fallback

### Database Schema
- **analyses**: Stores analysis metadata, status, results, and AI interpretations
- **users**: User management (prepared for future authentication)

## Data Flow

1. **File Upload**: User uploads file with optional research question
2. **Background Processing**: 
   - File parsing and data extraction
   - Statistical analysis computation
   - AI interpretation generation
   - Report creation
3. **Real-time Updates**: Frontend polls for status updates every 2 seconds
4. **Results Display**: Interactive preview of results with download options

## External Dependencies

### Core Technologies
- **Neon Database**: PostgreSQL hosting (configured but using in-memory storage)
- **OpenAI API**: GPT-4o for statistical interpretation
- **Drizzle ORM**: Type-safe database operations
- **TanStack Query**: Server state management and caching

### File Processing Libraries
- **XLSX**: Excel file parsing
- **csv-parser**: CSV file processing
- **mammoth**: Word document parsing
- **pdf-parse**: PDF text extraction

### UI Libraries
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **date-fns**: Date manipulation

## Deployment Strategy

### Development Environment
- **Vite Dev Server**: Hot module replacement for frontend
- **tsx**: TypeScript execution for backend
- **Development Middleware**: Error overlays and debugging tools

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations for schema management
- **Static Assets**: Express serves built frontend files

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **OPENAI_API_KEY**: OpenAI API authentication
- **NODE_ENV**: Environment mode (development/production)

### Key Design Decisions

1. **Monorepo Structure**: Simplifies development and deployment while maintaining clear separation
2. **In-Memory Storage Fallback**: Ensures application works without database setup
3. **Background Processing**: Non-blocking file analysis with real-time status updates
4. **Type Safety**: Shared schemas between frontend/backend using Drizzle and Zod
5. **Component Modularity**: shadcn/ui provides consistent, customizable components
6. **AI Integration**: OpenAI provides professional statistical interpretation
7. **Multi-Format Support**: Comprehensive file parsing for various data sources

The application prioritizes ease of use, professional output quality, and scalable architecture for statistical analysis workflows.