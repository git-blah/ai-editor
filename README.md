# Polaris - Build a Cursor AI Alternative

Polaris is a browser-based IDE inspired by Cursor AI, featuring:

- Real-time collaborative code editing
- AI-powered code suggestions and quick edit (Cmd+K)
- Conversation-based AI assistant
- In-browser code execution with WebContainer
- GitHub import/export integration
- Multi-file project management

Implementation of polaris project video from codewithantonio youtube video.

## Tech Stack

| Category      | Technologies                                                |
| ------------- | ----------------------------------------------------------- |
| **Frontend**  | Next.js 16, React 19, TypeScript, Tailwind CSS 4            |
| **Editor**    | CodeMirror 6, Custom Extensions, One Dark Theme             |
| **Backend**   | Convex (Real-time DB), Inngest (Background Jobs)            |
| **AI**        | Claude Sonnet 4 (preferred) or Gemini 2.0 Flash (free tier) |
| **Auth**      | Clerk (with GitHub OAuth)                                   |
| **Execution** | WebContainer API, xterm.js                                  |
| **UI**        | shadcn/ui, Radix UI                                         |

### Installation

1. Clone the repository:

   ```bash
   cd polaris
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

4. Configure your `.env.local` with the required keys:

   ```env
   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=

   # Convex
   NEXT_PUBLIC_CONVEX_URL=
   CONVEX_DEPLOYMENT=
   POLARIS_CONVEX_INTERNAL_KEY=  # Generate a random string

   # AI Provider (choose one)
   ANTHROPIC_API_KEY=        # Preferred - Claude Sonnet 4
   GOOGLE_GENERATIVE_AI_API_KEY=  # Free alternative - Gemini 2.0 Flash

   # Firecrawl (optional)
   FIRECRAWL_API_KEY=

   # Sentry (optional)
   SENTRY_DSN=
   ```

5. Start the Convex development server:

   ```bash
   npx convex dev
   ```

6. In a new terminal, start the Next.js development server:

   ```bash
   npm run dev
   ```

7. In another terminal, start the Inngest dev server:

   ```bash
   npx inngest-cli@latest dev
   ```

8. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── messages/      # Conversation API
│   │   ├── suggestion/    # AI suggestions
│   │   └── quick-edit/    # Cmd+K editing
│   └── projects/          # Project pages
├── components/            # Shared components
│   ├── ui/               # shadcn/ui components
│   └── ai-elements/      # AI conversation components
├── features/
│   ├── auth/             # Authentication
│   ├── conversations/    # AI chat system
│   ├── editor/           # CodeMirror setup
│   │   └── extensions/   # Custom extensions
│   ├── preview/          # WebContainer (Part 2)
│   └── projects/         # Project management
├── inngest/              # Inngest client
└── lib/                  # Utilities

convex/
├── schema.ts             # Database schema
├── projects.ts           # Project queries/mutations
├── files.ts              # File operations
├── conversations.ts      # Conversation operations
└── system.ts             # Internal API for Inngest
```

## Features Implemented

### Editor

- Syntax highlighting for JS, TS, CSS, HTML, JSON, Markdown, Python
- Line numbers and code folding
- Minimap overview
- Bracket matching and indentation guides
- Multi-cursor editing

### AI Features

- Real-time code suggestions with ghost text
- Quick edit with Cmd+K (select code + natural language instruction)
- Selection tooltip for quick actions
- Conversation sidebar with message history

### File Management

- File explorer with folder hierarchy
- Create, rename, delete files and folders
- VSCode-style file icons
- Tab-based file navigation
- Auto-save with debouncing

### Real-time

- Convex-powered instant updates
- Optimistic UI updates
- Background job processing with Inngest

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```
