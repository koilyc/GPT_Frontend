# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# AI Vision Platform Frontend

A modern React TypeScript frontend application for an AI vision platform that provides comprehensive tools for image annotation, model training, and computer vision project management.

## Features

- 🔐 **User Authentication** - Secure login and registration system
- 🏢 **Workspace Management** - Organize projects in workspaces
- 📊 **Project Management** - Create and manage AI vision projects (classification, detection, segmentation)
- 🖼️ **Image Management** - Upload, organize, and process images
- 🏷️ **Annotation Tools** - Annotate images with labels, bounding boxes, and polygons
- 🧠 **Model Training** - Train custom AI models on your datasets
- 🔮 **Predictions** - Run inference on new images with trained models
- 💳 **Subscription Management** - Manage subscription plans and billing

## Tech Stack

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Icons**: Lucide React
- **UI Components**: Custom components with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Running backend API (FastAPI)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gpt_frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` file to configure your API base URL:
```env
VITE_API_BASE_URL=http://localhost:8000
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── api/                 # API service functions
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard components
│   ├── layout/         # Layout components
│   └── ui/             # Reusable UI components
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## Backend Integration

This frontend is designed to work with a FastAPI backend that provides the following API endpoints:

- `/auth/*` - Authentication endpoints
- `/workspaces/*` - Workspace management
- `/projects/*` - Project management
- `/images/*` - Image upload and management
- `/annotations/*` - Annotation management
- `/models/*` - Model training and inference
- `/subscriptions/*` - Subscription management

## Development

### Code Style

- Use TypeScript for all components
- Follow React functional component patterns
- Use Tailwind CSS for styling
- Implement proper error handling
- Write meaningful commit messages

### State Management

The application uses Zustand for state management:

- `useAuthStore` - Authentication state
- `useAppStore` - Application-wide state (current workspace, project)

### API Integration

All API calls are centralized in the `src/api/` directory with proper TypeScript types and error handling.

## Documentation

For detailed documentation, please visit the [docs](./docs/) directory:

- 📖 **[API Reference](./docs/api/api-reference.md)** - Complete API endpoints documentation
- 🏗️ **[Architecture](./docs/architecture/)** - Frontend architecture and design decisions
- ✅ **[Validation Reports](./docs/validation/)** - Frontend-backend API validation and consistency reports
- ⚙️ **[GitHub Settings](./docs/github-settings.md)** - Repository configuration guide (including automatic branch deletion)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Repo-based Agent (示範)

這是一個把 agent 邏輯放在 repo 裡的示範。
工作流程：當 issue_comment / pull_request_review_comment 建立時，Workflow 會 checkout 並跑 scripts/agent.js。

設定（Repository → Settings → Secrets）：
- OPENAI_API_KEY: (如果你用 OpenAI)
- 若需要更多權限，請配置對應的 token（建議用 fine‑grained token 或 GitHub App）

測試：
1. push branch
2. 在 Issue / PR 留言以觸發事件
3. 查看 workflow 執行紀錄與 action 的行為

## License

This project is licensed under the MIT License.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
