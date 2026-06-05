# NexSend

**Share files. No accounts. No bullshit.**

A brutalist, utility-first web-based file transfer app. Create a room, share the 6-digit code (or QR), and send files directly to another device — no sign-ups, no servers, no bloat.

Built with Next.js and Supabase.

---

## Features

- **Peer-to-peer feel over Supabase** — Real-time room sync via Postgres replication, file transfer via Supabase Storage. No signaling servers, no WebRTC complexity.
- **Zero-loss files** — Raw blob upload/download. No compression, no transcoding, no quality loss.
- **Quick pairing** — Generate a 6-digit room code or scan a QR to instantly connect two devices.
- **Real-time progress** — Upload speed, ETA, and percentage update live during transfers.
- **1-hour auto-expiry** — Rooms and files are cleaned up after 1 hour or immediately after download completes.
- **Dark/light mode** — Persistent theme toggle with no-FOUC flash prevention.
- **QR scanner** — Camera-based QR scanning with manual code entry fallback.
- **1GB file limit**.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Font | [Geist](https://vercel.com/font) by Vercel |
| Icons | [Lucide React](https://lucide.dev/) |
| QR generation | [qrcode.react](https://github.com/zpao/qrcode.react) |
| QR scanning | [jsQR](https://github.com/cozmo/jsQR) |
| Backend | [Supabase](https://supabase.com/) |
| Auth | Supabase Anonymous Auth |
| Database | Postgres with Realtime subscriptions |
| Storage | Supabase Storage (private S3-backed buckets) |

---

## Setup

### 1. Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Fill in project details and wait for the database to provision
3. Enable **Anonymous sign-ins**: Authentication → Settings → **Allow anonymous sign-ins** → toggle on → Save
4. Run the SQL schema from `supabase/schema.sql` in the **SQL Editor**

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these in your Supabase dashboard → **Project Settings** → **API**.

### 3. Install & run

```bash
npm install
npm run dev
```

---

## Usage

1. Open the app on your **sending device** → click **Send**
2. A 6-digit room code and QR code are generated
3. Share the code or QR with the receiving device
4. On the **receiving device**, open the app → click **Receive** → enter the code or scan the QR
5. Both devices show "Connected"
6. Drop a file on the sender's screen — upload starts with live progress
7. The file instantly appears on the receiver's screen → click **Download**
8. File is saved as-is, room is cleaned up

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                # Home — SEND / RECEIVE buttons
│   ├── send/page.tsx           # Create room, drop file, upload
│   ├── receive/
│   │   ├── page.tsx            # Suspense wrapper
│   │   └── ReceiveContent.tsx  # Enter code / scan QR, download
│   └── room/[code]/page.tsx    # Direct room link (QR deep-link)
├── components/
│   ├── CreateRoom.tsx
│   ├── JoinRoom.tsx
│   ├── FileDropzone.tsx
│   ├── FileReceiver.tsx
│   ├── TransferProgress.tsx
│   ├── QRDisplay.tsx
│   ├── QRScanner.tsx
│   ├── ThemeToggle.tsx
│   └── Toast.tsx
├── hooks/
│   ├── useRoom.ts              # Supabase Realtime room subscription
│   ├── useFileTransfer.ts      # XHR upload with progress + Storage download
│   └── useTheme.ts
├── lib/
│   └── supabase.ts             # Supabase client + anonymous auth
├── types/index.ts
└── app/globals.css
```

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FPulkitt397%2FNexSend)

1. Push to GitHub
2. Import in Vercel
3. Add env vars in Vercel project settings
4. Deploy

---

## Design Principles

- **Brutalist**: Flat surfaces, sharp borders (0 radius), no shadows, no gradients
- **Utility-first**: Every element serves a function
- **Anti-slop**: No dashboard cards, no floating shapes, no confetti, no jargon
- **Monochromatic**: High-contrast dark/light with a single blue accent

---

## License

MIT
