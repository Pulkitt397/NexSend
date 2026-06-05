# NexSend

**Share files. No accounts. No bullshit.**

A brutalist, utility-first web-based file transfer app. Create a room, share the 6-digit code (or QR), and send files directly to another device — no sign-ups, no servers, no bloat.

Built with Next.js, Firebase, and a strict anti-slop design philosophy.

---

## Features

- **Peer-to-peer feel over Firebase** — Real-time room sync via Firestore, file transfer via Firebase Storage. No signaling servers, no WebRTC complexity.
- **Zero-loss files** — Raw blob upload/download. No compression, no transcoding, no quality loss. Every byte is preserved.
- **Quick pairing** — Generate a 6-digit room code or scan a QR to instantly connect two devices.
- **Real-time progress** — Upload speed, ETA, and percentage update live during transfers.
- **1-hour auto-expiry** — Rooms and files are cleaned up after 1 hour or immediately after download completes.
- **Dark/light mode** — Persistent theme toggle with no-FOUC flash prevention.
- **QR scanner** — Camera-based QR scanning with manual code entry fallback.
- **1GB file limit** — Enforced client-side and in Firebase Storage rules.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) — CSS-first config |
| Font | [Geist](https://vercel.com/font) by Vercel |
| Icons | [Lucide React](https://lucide.dev/) |
| QR generation | [qrcode.react](https://github.com/zpao/qrcode.react) |
| QR scanning | [jsQR](https://github.com/cozmo/jsQR) |
| Backend | [Firebase](https://firebase.google.com/) v11+ |
| Auth | Firebase Anonymous Authentication |
| Database | Cloud Firestore (real-time) |
| Storage | Cloud Storage (raw file blobs) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Anonymous Auth, Firestore, and Storage enabled

### Setup

1. Clone the repo:

```bash
git clone https://github.com/Pulkitt397/NexSend.git
cd NexSend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the project root with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

4. Run the dev server:

```bash
npm run dev
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) → your project
2. **Authentication** → Sign-in method → Enable **Anonymous**
3. **Firestore** → Create database → choose a region → start in test mode
4. **Storage** → Get started → start in test mode
5. Copy the security rules from `firestore.rules` and `storage.rules` into the Firebase console rule editors

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

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FPulkitt397%2FNexSend)

1. Push to GitHub
2. Import the repo in Vercel
3. Add the `NEXT_PUBLIC_FIREBASE_*` environment variables in Vercel project settings
4. Deploy — zero configuration needed

---

## Project Structure

```
src/
├── app/                     # Next.js App Router pages
│   ├── page.tsx             # Home — SEND / RECEIVE buttons
│   ├── send/page.tsx        # Create room, drop file, upload
│   ├── receive/             # Enter code / scan QR, download
│   └── room/[code]/page.tsx # Direct room link (QR deep-link)
├── components/              # UI components
│   ├── CreateRoom.tsx       # Room code display + QR
│   ├── JoinRoom.tsx         # 6-digit PIN entry + QR scanner
│   ├── FileDropzone.tsx     # Drag-and-drop upload zone
│   ├── FileReceiver.tsx     # Incoming file download card
│   ├── TransferProgress.tsx # Progress bar + speed + ETA
│   ├── QRDisplay.tsx        # QR code renderer
│   ├── QRScanner.tsx        # Camera QR scanner
│   ├── ThemeToggle.tsx      # Dark/light mode toggle
│   └── Toast.tsx            # Notification system
├── hooks/                   # React hooks
│   ├── useRoom.ts           # Firestore room CRUD + real-time sync
│   ├── useFileTransfer.ts   # Upload/download with progress tracking
│   └── useTheme.ts          # Theme persistence
├── lib/
│   ├── firebase.ts          # Firebase initialization + anon auth
│   └── utils.ts             # formatBytes, formatSpeed, generateCode
└── types/index.ts           # TypeScript type definitions
```

---

## Security Rules

See `firestore.rules` and `storage.rules` for the Firebase security configuration:
- Firestore: authenticated users only, sender/receiver scoped access
- Storage: authenticated users only, 1GB file size cap, room-scoped paths

---

## Design Principles

- **Brutalist**: Flat surfaces, sharp borders (0 radius), no shadows, no gradients
- **Utility-first**: Every element serves a function — no decorative flourishes
- **Anti-slop**: No dashboard cards, no floating shapes, no confetti, no jargon
- **Typographic**: Geist font, three sizes max, generous whitespace
- **Monochromatic**: High-contrast dark/light modes with a single blue accent

---

## License

MIT
