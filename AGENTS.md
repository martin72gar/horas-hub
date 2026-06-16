<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Context: HorasHub
This is a modern web application built with Next.js 16 (App Router) and React 19.

### Core Tech Stack
- **Framework**: Next.js 16.2.9 (App Router)
- **UI & Styling**: Tailwind CSS 4, @base-ui/react, shadcn/ui, lucide-react, tw-animate-css
- **Database & ORM**: Neon Serverless Postgres, Drizzle ORM
- **Authentication**: Next-Auth v5 (beta)
- **Language**: TypeScript 5

### Key Directories
- `src/app/`: App Router routes, pages, layouts, and API endpoints.
- `src/components/`: Reusable React components (UI elements, layout components).
- `src/db/`: Database configuration and Drizzle schema definitions.
- `src/lib/`: Utility functions, formatters, and shared helpers.
- `src/auth.ts`, `src/auth.config.ts`: Next-Auth v5 setup.

### Development Rules
- **Server Components First**: Prefer React Server Components. Only use `"use client"` when interactivity, hooks (useState, useEffect), or browser APIs are required.
- **Database Access**: Use Drizzle ORM for all database interactions.
- **Styling**: Use Tailwind CSS 4 utility classes.
- **Type Safety**: Strictly type components, database schemas, and API responses.
