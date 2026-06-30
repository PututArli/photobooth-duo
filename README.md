# PhotoBooth Duo 📸

Real-time online couple photobooth — foto berdua secara online dengan WebRTC dan Supabase Realtime.

## Fitur

- 🎥 **Live video berdua** via WebRTC peer-to-peer
- 📸 **Countdown sinkron** — keduanya ambil foto di waktu yang sama
- 🎨 **Customize bersama** — ubah filter, frame, border secara real-time (sync ke partner)
- 🖼 **Side-by-side layout** — foto digabung dalam satu frame
- 💾 **Download hasil** sebagai JPG
- ⚡ **Tanpa login** — cukup room code 6 digit

## Tech Stack

- **Frontend**: Next.js 13 (App Router)
- **Database + Realtime**: Supabase
- **Video**: WebRTC (peer-to-peer, Supabase sebagai signaling)
- **Hosting**: Vercel

---

## Setup

### 1. Clone & Install

```bash
cd photobooth-duo
npm install
```

### 2. Setup Supabase

1. Buat akun di [supabase.com](https://supabase.com)
2. Buat project baru
3. Buka **SQL Editor** di dashboard Supabase
4. Copy-paste isi file `supabase-schema.sql` dan jalankan
5. Di Supabase dashboard: **Database → Replication** → aktifkan realtime untuk tabel `rooms` dan `room_participants`

### 3. Environment Variables

Copy `.env.local.example` menjadi `.env.local`:

```bash
cp .env.local.example .env.local
```

Isi dengan credentials dari Supabase dashboard (**Settings → API**):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
```

### 4. Jalankan Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### 5. Test Duo Mode

Untuk test dua orang dalam satu komputer:
1. Buka Tab 1 → Buat Room → dapat kode (misal `ABC123`)
2. Buka Tab 2 di browser berbeda (Chrome + Firefox) → Gabung dengan kode `ABC123`
3. Kedua tab akan saling terhubung via WebRTC

---

## Deploy ke Vercel

### Cara 1: Via Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

### Cara 2: Via GitHub

1. Push project ke GitHub
2. Buka [vercel.com](https://vercel.com) → Import repository
3. Di **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

---

## Struktur Folder

```
photobooth-duo/
├── app/
│   ├── page.tsx              ← Landing page
│   ├── layout.tsx            ← Root layout
│   ├── not-found.tsx         ← 404 page
│   ├── globals.css           ← Design system CSS
│   └── room/[code]/
│       └── page.tsx          ← Room page (server component)
├── components/
│   └── PhotoboothRoom.tsx    ← Main room UI (client)
├── hooks/
│   ├── useRoom.ts            ← Room state + Supabase Realtime
│   └── useWebRTC.ts          ← WebRTC peer connection
├── lib/
│   ├── supabase.ts           ← Supabase client
│   ├── roomUtils.ts          ← Room CRUD helpers
│   ├── composition.ts        ← Canvas photo composer
│   └── types.ts              ← TypeScript types & constants
├── public/
│   └── logo.png
├── supabase-schema.sql       ← Database schema (jalankan di Supabase)
├── vercel.json               ← Vercel config
└── .env.local.example        ← Template env vars
```

---

## Catatan WebRTC

WebRTC **butuh HTTPS** untuk akses kamera. Di Vercel otomatis HTTPS. Untuk development lokal, gunakan `localhost` (browser mengizinkan kamera di localhost tanpa HTTPS).

Jika koneksi WebRTC gagal (NAT traversal), video partner tidak akan muncul tapi fungsi foto tetap bisa berjalan via Supabase Realtime.
