const cspDirectives = [
  "default-src 'self'",
  // 'unsafe-inline' dibutuhkan untuk script init tema di app/layout.jsx.
  // 'unsafe-eval' dibutuhkan Next.js saat development (aman dihapus nanti kalau mau lebih ketat, tes dulu di build production).
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  // Ganti/tambahkan domain Supabase project kamu di sini kalau berbeda.
  // wss:// wajib ditulis terpisah dari https:// karena CSP menganggap beda skema,
  // dan Supabase Realtime (dipakai untuk live update) konek lewat WebSocket.
  "connect-src 'self' https://walelatteylcsxhrpcis.supabase.co wss://walelatteylcsxhrpcis.supabase.co https://vitals.vercel-insights.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: cspDirectives },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
