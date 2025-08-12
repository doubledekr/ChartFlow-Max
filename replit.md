# Overview

ChartFlow is a professional chart designer application that enables users to create interactive financial charts with advanced customization capabilities. The application provides a Canva/Photoshop-like editor specifically designed for financial data visualization, featuring real-time chart generation, comprehensive styling controls, and export functionality. Users can drag and drop chart elements, apply professional color palettes and gradients, customize typography, and export charts in multiple formats (PNG, SVG, PDF).

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

- **Interactive Elements**: Fabric.js handles draggable chart elements (titles, annotations, arrows, badges)
- **Chart Rendering**: D3.js generates the actual financial charts with customizable styling
- **Data Processing**: Client-side data generation with configurable periods (1M, 3M, 6M, 1Y) and realistic stock price simulation

## Export and Persistence
Export functionality supports multiple formats with configurable options:

- **Format Support**: PNG, SVG, and PDF export capabilities
- **Resolution Control**: Multiple DPI settings for different use cases
- **Dimension Flexibility**: Customizable output dimensions for various media types

# External Dependencies

## Core Framework Dependencies
- **React 18**: Frontend framework with TypeScript support
- **Express.js**: Backend web server framework
- **Vite**: Build tool and development server

## Chart and Canvas Libraries
- **Fabric.js 5.3.0**: Interactive canvas library for draggable elements
- **D3.js 7.8.0**: Data visualization library for chart rendering
- **jsPDF**: PDF generation for export functionality

## UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Unstyled, accessible UI components
- **Lucide React**: Icon library

## Database and ORM
- **Drizzle ORM**: Type-safe SQL ORM with PostgreSQL dialect support
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **Drizzle Kit**: Database migration and schema management tools

## Development and Build Tools
- **TypeScript**: Static type checking
- **PostCSS**: CSS processing with Autoprefixer
- **ESBuild**: Fast JavaScript bundler for production builds

## Data Management
- **TanStack Query**: Server state management and caching
- **Wouter**: Lightweight client-side routing
- **React Hook Form**: Form state management with validation