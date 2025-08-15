# Overview

ChartFlow is a professional chart designer application that enables users to create interactive financial charts with advanced customization capabilities. The application provides a Canva/Photoshop-like editor specifically designed for financial data visualization, featuring real-time chart generation, comprehensive styling controls, and export functionality. Users can drag and drop chart elements, apply professional color palettes and gradients, customize typography, and export charts in multiple formats (PNG, SVG, PDF).

## Recent Changes (January 2025)

- **Multi-Symbol Chart System**: Implemented complete support for multiple stock symbols with distinct colored lines and unified Y-axis scaling
- **Advanced Layer Management**: Created comprehensive layer management system with grouping, visibility controls, reordering capabilities, and multi-symbol grouping
- **Symbol-Specific Properties**: Each chart line maintains its own symbol identifier, color assignment, and independent styling controls
- **Optimized Y-axis Scaling**: Implemented percentile-based scaling (10th/90th percentiles) that eliminates unnecessary whitespace by excluding outlier data points, creating tight professional chart bounds
- **Interactive Layer Panel**: Layer manager panel shows/hides based on selection state, providing full control over overlapping elements and multi-line charts
- **Independent Component Selection**: Chart line, axis lines, and axis labels are now separate elements that can be selected and edited independently
- **Optimized Chart Positioning**: Established default positioning at 120px from top, horizontally centered with proper Y-axis label spacing
- **Clean Vector Interface**: Removed all data information overlays for clean, professional appearance
- **Template-Ready Architecture**: Each component saves position and properties separately for accurate template restoration
- **Complete Grid Line System**: Implemented fully functional horizontal and vertical grid lines that extend from axis lines with independent toggle controls and professional styling
- **Chart Line Entity Persistence**: Fixed critical layer duplication issue by implementing in-place path updates that preserve chart line object identity throughout all property changes
- **Enhanced Undo/Redo System**: Comprehensive save state checkpoint system with automatic triggers for property updates, chart regeneration, and canvas modifications

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application follows a modern React-based architecture with TypeScript for type safety. The frontend is built using React with a component-based structure organized around the chart designer interface. Key architectural decisions include:

- **Component Organization**: Modular design with separate panels for different chart customization aspects (ColorPalettePanel, GradientEffectsPanel, LineStylingPanel, etc.)
- **State Management**: Custom hooks (`useChartDesigner`, `useChartData`) handle chart configuration and data management without requiring external state management libraries
- **Canvas Integration**: Dual canvas approach using both Fabric.js for interactive element manipulation and D3.js for chart rendering
- **Styling System**: Tailwind CSS with shadcn/ui components for consistent design and responsive layout

## Backend Architecture
The backend uses Express.js with a minimal API surface designed primarily to support the frontend's chart functionality:

- **Route Structure**: Simple REST endpoints for stock data retrieval and chart project management
- **Data Storage**: Currently uses in-memory storage with interface-based design (`IStorage`) allowing easy migration to persistent storage
- **Development Integration**: Vite integration for hot module replacement and development server capabilities

## Chart Generation System
The core chart functionality combines multiple libraries for different aspects:

- **Independent Chart Components**: Fabric.js handles separate selectable elements - chart line, Y-axis line, X-axis line, Y-axis labels, X-axis labels
- **Optimized Positioning**: Default chart positioning at 120px from top, horizontally centered with calculated Y-axis label spacing
- **Chart Rendering**: D3.js generates chart data points, with chart lines rendered as draggable Fabric.js paths
- **Template System**: Complete CRUD operations for saving chart layouts and reusing them across different stock symbols, preserving exact component positions
- **Data Processing**: Polygon API integration with intelligent caching for realistic financial data

## Export and Persistence
Export functionality supports multiple formats with configurable options:

- **Format Support**: PNG, SVG, and PDF export capabilities
- **Resolution Control**: Multiple DPI settings for different use cases
- **Dimension Flexibility**: Customizable output dimensions for various media types

# External Dependencies

## Core Framework Dependencies
- **React 18**: Frontend framework with TypeScript support
- **Express.js**: Backend web server framework with authentication middleware
- **Vite**: Build tool and development server

## Chart and Canvas Libraries
- **Fabric.js 5.3.0**: Interactive canvas library for draggable elements and annotations
- **D3.js 7.8.0**: Data visualization library for financial chart rendering
- **jsPDF**: PDF generation for chart export functionality

## UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Unstyled, accessible UI components for dialogs, selects, etc.
- **Lucide React**: Icon library for financial and UI icons

## Database and ORM
- **Drizzle ORM**: Type-safe SQL ORM with PostgreSQL dialect support
- **PostgreSQL**: Database for templates, chart instances, and user data
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **Drizzle Kit**: Database migration and schema management tools

## Financial Data Integration
- **Polygon.io API**: Real-time and historical stock market data source
- **Custom caching layer**: Database-backed API response caching for rate limiting

## Authentication and Security
- **Replit Auth**: OpenID Connect authentication system
- **Passport.js**: Authentication middleware for Express
- **Express Sessions**: Session management with PostgreSQL storage

## Development and Build Tools
- **TypeScript**: Static type checking
- **PostCSS**: CSS processing with Autoprefixer
- **ESBuild**: Fast JavaScript bundler for production builds

## Data Management
- **TanStack Query**: Server state management and API caching
- **Wouter**: Lightweight client-side routing
- **React Hook Form**: Form state management with Zod validation