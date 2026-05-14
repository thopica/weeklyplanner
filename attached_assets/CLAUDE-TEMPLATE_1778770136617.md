# LOCAL STANDALONE APP TEMPLATE

## Project Philosophy
**Target**: Absolute beginners with zero technical knowledge
**Distribution**: Single HTML file - double-click to run
**Platform**: Cross-platform (Windows, Mac, Linux) 
**Connectivity**: Offline-first, no backend required
**Data**: Local persistence using localStorage

## Tech Stack (Required)
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build**: Vite with vite-plugin-singlefile
- **UI Components**: shadcn/ui
- **Icons**: Lucide React or Heroicons
- **Storage**: localStorage with custom storage utilities
- **Fonts**: Inter font family (professional sans-serif)

## Architecture Patterns

### File Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── page-header.tsx # Standard page header
├── pages/              # Page components (Dashboard, Settings, etc.)
├── lib/
│   ├── storage.ts      # localStorage utilities
│   ├── utils.ts        # Common utilities
│   └── types.ts        # TypeScript definitions
└── App.tsx             # Main app with router
```

### Storage Pattern
```typescript
// Always use this pattern for localStorage
import { getStorageData, setStorageData, STORAGE_KEYS } from '@/lib/storage'

const data = getStorageData<DataType[]>(STORAGE_KEYS.DATA_NAME, [])
setStorageData(STORAGE_KEYS.DATA_NAME, updatedData)
```

### Component Patterns
- Use functional components with hooks
- Implement layouts appropriate to content and app type
- Add micro-interactions where they enhance UX
- Ensure mobile-responsive design
- Follow consistent patterns within the project

## Design Standards (Project-Specific)
- Use appropriate typography for the app type and audience
- Choose colors that match the app's purpose and branding
- Implement responsive layouts suitable for the content
- Follow accessibility best practices

## Build Configuration

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: { manualChunks: undefined }
    }
  },
  resolve: {
    alias: { '@': '/src' }
  }
})
```

### Package Dependencies
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "vite-plugin-singlefile": "latest",
    "tailwindcss": "latest",
    "@types/node": "latest",
    "typescript": "latest"
  }
}
```

## Distribution Process

### Build Commands
1. `npm run build` - Creates single HTML file
2. Copy `dist/index.html` to descriptive name (e.g., `app-name.html`)
3. Create `README-USAGE.txt` with simple instructions
4. Zip both files for distribution

### User Instructions Template
```
HOW TO USE:
1. Double-click "[app-name].html"
2. Your web browser will open the app
3. Start using immediately!

FEATURES:
- [List main features]
- Works offline
- No installation required
- Private data (stored locally)

FIRST TIME:
- [App-specific getting started steps]
```

## Common Features to Include

### Standard Components
- Navigation/sidebar
- Page headers with titles/descriptions
- Data import/export functionality
- Settings page with demo data loading
- Dark/light mode toggle
- Responsive design

### Data Management
- Demo data for new users
- Clear data functionality
- Export to JSON/CSV
- Import from JSON/CSV
- Data validation

### UX Considerations
- Loading states
- Empty states with clear CTAs
- Error handling with user-friendly messages
- Keyboard navigation
- Screen reader support

## Success Criteria
- ✅ Single HTML file under 3MB
- ✅ Works by double-clicking (no setup)
- ✅ Cross-platform compatibility
- ✅ Professional appearance
- ✅ Intuitive for beginners
- ✅ Fast loading (<2 seconds)
- ✅ Responsive design
- ✅ Accessible (keyboard + screen readers)

## Anti-Patterns (Avoid)
- ❌ External API dependencies
- ❌ Complex setup requirements
- ❌ Node.js server requirements
- ❌ Database connections
- ❌ Authentication systems
- ❌ File system access
- ❌ Multiple HTML files
- ❌ Fonts/design choices inappropriate for app type