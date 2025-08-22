# CoralBricks Authentication Frontend

This directory contains a React-based frontend for the CoralBricks authentication service, copied from the main coralbricks project.

## Features

- **Modern React 19** with TypeScript
- **Tailwind CSS** for styling with custom coral/brick color scheme
- **Framer Motion** for smooth animations
- **Supabase Integration** for authentication
- **Responsive Design** with mobile-first approach

## Components

- `Login.tsx` - Main authentication page with sign in, sign up, and password reset
- `AuthContext.tsx` - React context for managing authentication state
- `App.tsx` - Main application component with routing

## Setup Instructions

### 1. Install Frontend Dependencies

```bash
# Install React and related dependencies
npm install @headlessui/react @heroicons/react @supabase/supabase-js framer-motion react react-dom react-router-dom

# Install dev dependencies
npm install -D @types/react @types/react-dom @types/react-router-dom autoprefixer postcss tailwindcss typescript
```

### 2. Build and Run

```bash
# Build the frontend
npm run build

# Or run in development mode
npm start
```

### 3. Integration with Backend

The frontend is designed to work with your existing Node.js backend running on port 3001. The authentication flow integrates with Supabase while maintaining compatibility with your backend API.

## File Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (AuthContext)
├── lib/               # Utility libraries (Supabase client)
├── pages/             # Page components (Login)
├── App.tsx            # Main app component
├── index.tsx          # React entry point
└── index.css          # Global styles with Tailwind

public/
└── index.html         # HTML template

tailwind.config.js     # Tailwind configuration
postcss.config.js      # PostCSS configuration
```

## Customization

- **Colors**: Modify the coral and brick color schemes in `tailwind.config.js`
- **Styling**: Update styles in `src/index.css`
- **Authentication**: Configure Supabase settings in `src/lib/supabase.ts`

## Notes

- This frontend is separate from your existing Node.js backend
- It provides a modern, responsive UI for authentication
- The design follows the CoralBricks brand guidelines
- All authentication state is managed through React Context 