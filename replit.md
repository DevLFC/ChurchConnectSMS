# Church SMS Connect

## Overview

Church SMS Connect is a comprehensive church management application designed to help churches manage their congregation members, track attendance, and communicate via bulk SMS messaging. The platform combines member database management with attendance tracking and multi-provider SMS capabilities, all wrapped in a spiritual purple and gold color scheme.

The application enables church administrators to:
- Maintain a member directory with contact information, organizational details, and birthdays
- Record and analyze attendance patterns for church services
- Create reusable SMS templates for different communication scenarios
- Configure multiple SMS providers for bulk messaging
- Track SMS delivery history and engagement
- Manage role-based access control with Department Leader role for department-specific data access
- Sort and filter members by various criteria (name, department, gender, birthday)
- Automatically send personalized birthday messages to members on their special day
- Manage birthday message templates and track delivery logs

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI Component System:**
- shadcn/ui component library (New York variant) for consistent, accessible UI elements
- Radix UI primitives as the foundation for interactive components
- Tailwind CSS for utility-first styling with custom design tokens
- Framer Motion for smooth animations and transitions

**Design System:**
- Purple and orange/gold color palette (Primary: #9333ea/#7c3aed purple, Accent: #f97316/#fb923c orange/gold)
- Glassmorphic card effects with backdrop blur (8px), white/80 opacity, and purple-200 borders
- Gradient backgrounds: purple-50 via white to orange-50 on body, gradient purple buttons
- Typography hierarchy using Inter font family throughout for consistency
- Responsive layout system with mobile-first approach
- CSS variables for theming with light/dark mode support
- Church-themed with elegant, spiritual feel

**State Management:**
- React Hook Form with Zod validation for form handling
- TanStack Query for API data fetching, caching, and synchronization
- Local component state for UI interactions
- Toast notifications for user feedback

### Backend Architecture

**Server Framework:**
- Express.js for HTTP server and API routing
- TypeScript for type safety across the entire stack
- ESM module system for modern JavaScript

**API Design:**
- RESTful API endpoints organized by resource (members, attendance, SMS templates, providers, logs)
- JSON request/response format
- CRUD operations for all major entities
- Bulk operations support (CSV import, bulk attendance marking)

**Data Storage Strategy:**
- PostgreSQL database with Drizzle ORM for persistent data storage
- DatabaseStorage implementation with full CRUD operations
- Schema-first design with Zod validation ensuring data integrity
- Database schema defined in shared code for client-server type consistency
- Unique constraint on attendance (memberId, serviceDate) to prevent duplicates

**File Processing:**
- Multer middleware for handling multipart/form-data (CSV uploads)
- csv-parse library for parsing member import files
- Memory storage strategy for file uploads

### Data Model

**Core Entities:**

1. **Members** - Church congregation directory
   - Identity: id, name, phone
   - Organization: department, gender, status (Active/Inactive)
   - Personal: birthday (optional)
   - Supports CSV bulk import
   - Sortable by name, department, gender, and birthday

2. **Attendance** - Service participation tracking
   - Links to member via memberId
   - Records serviceDate and status (Present/Absent)
   - Timestamp tracking with markedAt

3. **SMS Templates** - Reusable message formats
   - Template content with placeholder support ({{name}}, {{department}}, {{phone}})
   - Categorization for different use cases
   - Creation timestamp tracking

4. **SMS Providers** - Multi-provider SMS gateway configuration
   - Provider metadata: name, apiEndpoint
   - Flexible authentication: supports both API key and username/password methods
   - Configurable request methods (GET/POST)
   - Request format templates with parameter mapping
   - Active/inactive status toggling

5. **SMS Logs** - Message delivery history
   - Tracks recipient details, message content, provider used
   - Delivery status monitoring
   - Timestamp for audit trail

6. **Users** - Authentication and role-based access control
   - Identity: id, username, email, password (hashed)
   - Role: Admin, Pastor, Secretary, or Department Leader
   - Department: Required for Department Leader role, optional for others
   - Department Leaders can only view members and attendance from their assigned department
   - Profile image support for future enhancement

7. **Birthday Messages** - Automated birthday message templates
   - Template content with {{name}} placeholder for first name
   - Active/inactive status (only one can be active at a time)
   - Unique partial index enforces single active template
   - Admin-only management (create, edit, delete, activate)
   - Timestamps for creation and last update

8. **Birthday Logs** - Birthday message delivery tracking
   - Member details: memberId, memberName, memberPhone
   - Message content sent
   - Sent date and timestamp
   - Delivery status and provider used
   - Unique constraint on (memberId, sentDate) prevents duplicate sends
   - Viewable by Admins and Pastors only

### External Dependencies

**Database & ORM:**
- PostgreSQL via Neon serverless driver (@neondatabase/serverless) for production data storage
- Drizzle ORM for type-safe database operations and migrations
- connect-pg-simple for session storage (configured but session implementation not visible in routes)

**SMS Integration:**
- Multi-provider architecture supporting various SMS gateways
- Built-in templates for BulkSMSNigeria (POST with API key) and NigeriaBulkSMS (GET with username/password)
- Extensible provider system allowing custom SMS gateway integration
- SMSService class handles actual API calls to configured providers
- Template placeholder replacement ({{name}} uses first name only, {{department}}, {{phone}})
- Delivery status tracking and error handling
- Bulk SMS sending with individual recipient tracking
- Automatic daily birthday check at 8:00 AM using node-cron scheduler
- Birthday message system with duplicate prevention via unique constraints

**Third-party Services:**
- SMS providers are configured through the settings interface but require backend integration
- No direct API calls from frontend - SMS operations must be implemented server-side

**Development Tools:**
- Replit-specific plugins for development experience (cartographer, dev-banner, runtime-error-modal)
- esbuild for production server bundling
- tsx for TypeScript execution in development

**Type Safety & Validation:**
- Zod for runtime type validation and schema definition
- Drizzle-zod for automatic schema generation from database models
- TypeScript strict mode enabled across the codebase

**Authentication & Authorization:**
- Session-based authentication with express-session and connect-pg-simple
- Cookie-based session management storing userId, userRole, username, and userDepartment
- Role-based access control (RBAC) with four roles: Admin, Pastor, Secretary, Department Leader
- Department Leader role enforcement:
  - Schema validation requires non-empty department during registration
  - API routes return 403 if Department Leader lacks department assignment
  - Members and attendance endpoints filter results by department for Department Leaders
- Secure password hashing with bcrypt

### Key Architectural Decisions

**Monorepo Structure:**
- Shared schema definitions between client and server in `/shared` directory prevents type drift
- Centralized TypeScript configuration with path aliases (@/, @shared, @assets)
- Single build process producing both client and server artifacts

**Storage Abstraction:**
- IStorage interface provides flexibility to swap storage implementations
- Current in-memory implementation (MemStorage) for development
- Drizzle configuration ready for PostgreSQL migration with minimal code changes
- All storage operations return Promises to support async database operations

**Component Architecture:**
- Atomic design pattern with UI components in separate files
- Page-level components handle business logic and data fetching
- Shared components (sidebar, theme toggle) for common functionality
- Form components use controlled inputs with validation

**API Communication:**
- Centralized API request utility (apiRequest) with consistent error handling
- React Query integration for automatic refetching and cache invalidation
- Optimistic updates not implemented - relies on server response for state updates

**Styling Approach:**
- CSS-in-JS avoided in favor of utility classes for better performance
- Theme variables defined in CSS for runtime switching (light/dark mode)
- Custom design tokens for church-specific branding
- Responsive breakpoints handled through Tailwind utilities

**Error Handling:**
- Try-catch blocks in API routes with appropriate HTTP status codes
- Client-side error boundaries not visible but likely needed for production
- Toast notifications for user-facing error messages
- Validation errors caught at form level with field-specific messages