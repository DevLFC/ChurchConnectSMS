# Church SMS Connect - Design Guidelines

## Design Approach
**Stripe-Inspired Design**: Clean, modern, and professional design following Stripe's aesthetic principles - minimalist interface with indigo-blue accents, subtle shadows, and excellent readability.

## Core Design Principles
- **Clean & Professional**: Modern, minimalist design that emphasizes clarity and functionality
- **Trust & Clarity**: Clear information hierarchy with excellent readability and contrast
- **Accessibility First**: Ensure all features are easily accessible with strong visual hierarchy
- **Subtle Elegance**: Refined details without unnecessary ornamentation

## Color Palette

### Primary Colors (Indigo Blue - Stripe Inspired)
- **Primary Indigo**: 243 75% 59% (Main brand color for headers, primary actions, buttons)
- **Primary Dark**: 243 75% 54% (Hover states, active elements)
- **Primary Light**: 243 100% 97% (Subtle backgrounds, highlights)

### Neutral Colors (Clean Grays)
- **Foreground**: 222 47% 11% (Primary text color)
- **Muted Foreground**: 215 16% 47% (Secondary text, captions)
- **Border**: 214 15% 91% (Dividers, subtle borders)
- **Muted**: 220 14% 96% (Secondary backgrounds)

### Functional Colors
- **Success Green**: 142 71% 45% (Success states, present status)
- **Info Blue**: 198 93% 60% (Informational states, highlights)
- **Warning**: 25 95% 53% (Warning states, absent status)
- **Error Red**: 0 84% 60% (Destructive actions, errors)

### Background & Surface
- **Background**: 0 0% 100% (Clean white main background)
- **Card Surface**: 0 0% 100% (Cards, panels, tables)
- **Card Border**: 214 15% 91% (Clean, subtle borders)

## Typography

### Font Families
- **Primary**: Inter (all text, headings, body, UI elements, data tables)
- **Monospace**: JetBrains Mono (code blocks, technical content)

### Type Scale
- **Hero/Page Title**: text-4xl font-bold (Inter)
- **Section Headers**: text-2xl font-semibold (Inter)
- **Card Titles**: text-lg font-semibold (Inter)
- **Body Text**: text-base (Inter)
- **Captions/Metadata**: text-sm text-muted-foreground (Inter)

## Layout System

### Spacing Primitives
Use Tailwind units: **2, 4, 6, 8, 12, 16** for consistent spacing rhythm
- Component padding: p-6 or p-8
- Section gaps: gap-6 or gap-8
- Card spacing: space-y-4

### Grid Structure
- **Sidebar Navigation**: Fixed width 280px (desktop), collapsible drawer (mobile)
- **Main Content**: flex-1 with max-w-7xl container
- **Dashboard Grid**: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 for stats cards
- **Tables**: Full width with horizontal scroll on mobile

## Component Library

### Navigation
- **Sidebar**: Fixed left sidebar with clean indigo background (243 75% 59%)
- **Logo Area**: Church icon + "Church SMS Connect" text at top
- **Nav Items**: Icon + label, subtle hover states with elevated background, active state with light indigo background
- **Mobile**: Hamburger menu triggering slide-out drawer

### Dashboard Cards
- **Stat Cards**: White background, minimal shadow, clean indigo icon on solid background, large number display, descriptive label
- **Chart Card**: Larger card spanning 2 columns, clean line/area charts with indigo accents
- **Recent Activity**: List card with clean layout showing recent SMS activity

### Data Tables
- **Header**: Clean white background with medium-weight text
- **Rows**: Clean white background with subtle hover states
- **Actions**: Icon buttons (Edit: pencil, Delete: trash, View: eye) in neutral colors with indigo on hover
- **Status Badges**: Rounded pills - Active (green), Inactive (gray), Present (green), Absent (warning)

### Forms
- **Input Fields**: White background, clean borders, indigo focus ring
- **Labels**: text-sm font-medium mb-2 in foreground color
- **Buttons Primary**: Indigo background with subtle hover darkening, rounded-md
- **Buttons Secondary**: Outline variant with neutral border
- **Template Editor**: Monospace font for template placeholders

### Modals & Dialogs
- **Overlay**: Semi-transparent dark backdrop
- **Container**: White rounded-lg with subtle shadow, max-width based on content
- **Header**: Clean typography with good contrast
- **Actions**: Right-aligned with Cancel (outline) and Confirm (filled indigo)

### SMS Provider Cards
- **Provider Card**: White card with clean borders, provider logo/icon area, configuration fields collapsible
- **Authentication Badges**: Clean, minimal badges with appropriate colors

## Page-Specific Layouts

### Dashboard
- **Top Stats Row**: 4 stat cards (Total Members, Present This Month, Absent This Month, SMS Sent)
- **Middle Section**: Attendance trends chart (left 2/3) + Quick Actions card (right 1/3)
- **Bottom Section**: Recent SMS Activity list

### Members Management
- **Header Bar**: Search input, filter dropdowns (Department, Status), Import CSV button, Add Member button (indigo)
- **Table View**: Full-width responsive table with pagination
- **Bulk Actions**: Checkbox column, bulk SMS button appears when selections made

### Attendance Tracking
- **Date Selector**: Prominent calendar input with clean styling
- **Summary Cards**: 3 cards showing Total/Present/Absent counts with visual progress bars
- **Member Grid**: Cards or list view toggle, each member with Present/Absent toggle buttons
- **Submit Button**: Large indigo button at bottom to save attendance

### SMS Templates
- **Template List**: Left sidebar (30% width) with saved templates
- **Editor Panel**: Right panel (70%) with template name input, subject selector (Present/Absent), rich text editor with placeholder insertion buttons
- **Preview**: Live preview pane showing rendered template with sample data

### Settings
- **Tab Navigation**: Horizontal tabs (SMS Providers, General Settings, User Preferences)
- **Provider Configuration**: Accordion-style sections for each provider with test send button
- **Implementation Guide**: Code blocks with syntax highlighting, copy button, tabs for Node.js/Django

## Utility Classes

### Available CSS Utilities
- **glass-card**: Clean card background with proper border (no longer glassmorphic)
- **gradient-purple-orange**: Subtle indigo gradient for accent areas
- **gradient-purple**: Solid indigo background for primary actions
- **gradient-icon-purple/green/orange**: Flat icon backgrounds in brand colors
- **shadow-soft/shadow-soft-lg**: Subtle, clean shadows
- **transition-smooth/transition-smooth-fast**: Smooth transitions with proper easing

These utilities maintain clean, professional styling aligned with Stripe's aesthetic.

## Animations & Interactions

### Page Transitions
- Subtle fade in content on mount (0.2s ease-out)
- Minimal stagger for dashboard cards (0.05s delay between each)

### Micro-interactions
- Button hover: Subtle background darkening with 0.15s transition
- Card hover: Very subtle shadow increase (no transform)
- Loading states: Clean skeleton screens with subtle shimmer
- Success/Error toast: Slide in from top-right with smooth easing

### Data Updates
- Table row updates: Fade transition with subtle highlight
- Counter animations: Smooth number transitions
- Chart animations: Clean draw-in effect on load (0.8s duration)

## Imagery

### Icons
- **Icon Library**: Lucide React icons throughout
- **Sidebar Icons**: Users, Calendar, MessageSquare, FileText, Settings, BarChart
- **Color**: White in sidebar, neutral/indigo in content areas

### Illustrations
No hero images needed for this admin application. Focus on data clarity and functional design.

### Background Treatments
- **Clean Backgrounds**: Solid white backgrounds for clarity
- **Subtle Patterns**: Optional very subtle patterns for visual interest, if needed

## Responsive Behavior

- **Desktop (lg+)**: Full sidebar visible, 4-column dashboard grid, side-by-side forms
- **Tablet (md)**: Collapsible sidebar, 2-column dashboard grid, stacked form sections
- **Mobile (base)**: Drawer navigation, single column layout, horizontal scroll for tables, stacked stat cards

## Accessibility
- ARIA labels on all icon buttons
- Keyboard navigation support for all interactive elements
- Focus visible states with indigo outline
- Screen reader announcements for dynamic content updates
- Minimum contrast ratio 4.5:1 for all text