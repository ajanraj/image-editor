# Image editor powered by gemini 2.5 flash image (Nano Banana)

Nano Banana image generator and editor on Next.js 15 + React 19. Create from text, edit from images, or combine multiple sources into a new result using a canvas powered by React Flow (XYFlow). Uses Google’s Generative AI (Gemini) in the browser via `@google/genai` and the `gemini-2.5-flash-image-preview` model.


## Features

- Node graph editor with Image and Text nodes
- Text → Image generation from prompts
- Image → Image editing by connecting an image to a Text node
- Multi‑source compositing: connect multiple images into one Text node
- Drag & drop images anywhere to create Image nodes
- On‑node prompt field + Regenerate for Image nodes
- Prompt presets via slash commands (`/film`, `/retouch`, `/makeup`, `/remove`, `/weather`, `/background`, `/hair`, `/outfit`, `/style`)
- Keyboard shortcuts: Cmd/Ctrl+Click (Text), Shift+Cmd/Ctrl+Click (Image), Cmd/Ctrl+Enter (submit)
- Download generated images from the preview
- Collapsible in‑app guide; minimap and canvas controls; dotted background
- In‑memory API key (indicator dot when set); nothing persisted by default


## Quick Start

- Requirements
  - Node 18+ (Node 20 LTS recommended) or Bun 1.1+
  - macOS, Linux, or Windows

- Install
  - bun: `bun install`

- Run (dev)
  - bun: `bun run dev`
  - Open `http://localhost:3000`

- Build / Start
  - Build: `bun run build`


## Using Gemini

- Click the key icon in the top‑right to paste your Gemini API key.
- The key is stored only in memory for this browser tab/session and is lost on reload.
- Image generation/editing will not work until a key is set.

Notes
- Calls are made client‑side. Your key and any images you include in prompts are sent directly from your browser to Google’s API.
- Treat your key as sensitive; avoid sharing or screen‑recording it.


## Canvas Basics

- Add nodes
  - Cmd/Ctrl + Click: add a Text node
  - Shift + Cmd/Ctrl + Click: add an empty Image node
  - Drag & drop image files anywhere to create Image nodes (one per file)

- Connect nodes
  - Connect Image (bottom handle) → Text (top/left/right handles) to “edit” that image with a text prompt
  - You can connect multiple Image nodes into one Text node to combine sources

- Generate / Edit
  - Type a prompt in a Text node and press the arrow button or Cmd/Ctrl+Enter
  - A new Image node is created with the result
  - On an Image node, you can tweak the “Prompt” field and click Regenerate

- Download
  - Use the circular download button on the image preview (bottom‑right)

- Guide
  - The collapsible guide in the top‑left summarizes controls and features


## Slash Commands (Prompt Presets)

Type `/` at the start of a Text node to open command presets. Pick a command, adjust options, and insert a well‑structured prompt. Available commands include:

- `/film` — Fujifilm film looks (Classic Chrome, Eterna, etc.)
- `/retouch` — Skin, eyes, teeth, flyaways; preserve texture
- `/makeup` — Style + palette presets
- `/remove` — Object/person removal with natural fill
- `/weather` — Time, season, atmosphere changes
- `/background` — Replace or restyle backgrounds
- `/hair` — Hairstyles with women/men variants
- `/outfit` — Wardrobe/outfit restyle
- `/style` — General look/feel presets


## Tech Stack

- Framework: `next@15`, `react@19`, `react-dom@19`
- Canvas: `@xyflow/react` (React Flow)
- UI: Radix Primitives + shadcn/ui, `lucide-react`, `sonner`
- Styling: Tailwind CSS v4
- AI SDK: `@google/genai`
- DX: `@biomejs/biome` for lint/format; Turbopack dev/build

Useful scripts (from `package.json`)
- `dev` — `next dev --turbopack`
- `build` — `next build --turbopack`
- `start` — `next start`
- `lint` — `biome check`
- `format` — `biome format --write`


## Project Structure

- `app/` — Next.js App Router pages, layout and global styles
- `components/`
  - `nodes/` — Custom React Flow nodes: `TextNode`, `ImageNode`
  - `gemini/` — API key dialog/button
  - `ui/` — Reusable UI components (shadcn‑style)
- `lib/`
  - `gemini.ts` — Client helpers calling `gemini-2.5-flash-image-preview`
  - `gemini-key-context.tsx` — In‑memory API key context
  - `slash-commands.ts` — Definitions for `/` prompt presets
- `hooks/` — Small React hooks (e.g., `useIsMobile`)
- `public/` — Static assets


## Notes & Caveats

- Client‑only Gemini calls:
  - This demo keeps everything in the browser for simplicity. For production, you should proxy requests through a server to avoid exposing API keys and to apply rate‑limits/abuse protection.

- Build settings:
  - ESLint and TypeScript build errors are set to be ignored during production builds in `next.config.ts`. Tighten these rules before shipping.

- Model behavior:
  - Uses `gemini-2.5-flash-image-preview`. Image generations can vary; tweaks to prompts often help.


## Troubleshooting

- “Gemini API key is not set”
  - Click the key icon and paste a valid key. The indicator dot on the button turns green when set.

- Images don’t download
  - Ensure the generated node shows an image preview first. Browser pop‑up blockers can also interfere with downloads.

- Canvas feels unresponsive on mobile
  - On very small screens, prefer desktop or a larger viewport; complex graphs render best on bigger canvases.


## Roadmap Ideas

- Persist graphs to local storage or file
- Undo/redo, multi‑select, and node grouping
- Server‑side proxy for Gemini with auth/rate‑limits
- Export options (PNG/JPEG/WebP, quality, upscaling)


## Acknowledgements

- React Flow by XYFlow (`@xyflow/react`)
- shadcn/ui + Radix UI primitives
- Lucide icons (`lucide-react`)
- Sonner (`sonner`) for toasts
- Google Generative AI (`@google/genai`)


## License

MIT — see `LICENSE` for details.
