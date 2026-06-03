/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Clickjacking — both header and CSP directive for maximum compat
          { key: 'X-Frame-Options',       value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=()' },
          // 0 = disabled — the legacy X-XSS-Protection filter can itself introduce XSS
          { key: 'X-XSS-Protection',       value: '0' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // unsafe-inline required: boot-screen init script in layout.tsx and Tailwind
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              // data: for base64 logo; blob: for PDF preview
              "img-src 'self' data: blob:",
              // Cal.com API calls from the server never hit this, but client-side fetch does
              "connect-src 'self' https://api.cal.com",
              "font-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
