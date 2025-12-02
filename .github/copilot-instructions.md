# Copilot Instructions for AI Vision Platform Frontend

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a React TypeScript frontend application for an AI vision platform. The application integrates with a FastAPI backend that provides the following capabilities:

## Backend API Endpoints
- **Authentication**: User registration, login, password reset
- **Workspaces**: Create and manage workspaces for organizing projects
- **Projects**: Create and manage AI vision projects within workspaces
- **Images**: Upload, manage, and process images
- **Annotations**: Create and manage image annotations and labels
- **Models**: Train and manage AI models
- **Predictions**: Run predictions and auto-labeling on images
- **Subscriptions**: Manage user subscription plans and billing

## Technical Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS for modern UI components
- **State Management**: React Context + useReducer or Zustand
- **HTTP Client**: Axios for API calls
- **Routing**: React Router v6
- **UI Components**: Modern component library (Shadcn/ui or similar)
- **Authentication**: JWT token-based authentication

## Code Style Guidelines
- Use functional components with TypeScript
- Implement proper error handling and loading states
- Follow React best practices and hooks patterns
- Use consistent naming conventions (camelCase for variables, PascalCase for components)
- Implement responsive design with Tailwind CSS
- Create reusable components and custom hooks
- Use proper TypeScript types and interfaces

## Security Considerations
- Store JWT tokens securely
- Implement proper authentication checks
- Validate user inputs
- Handle API errors gracefully
