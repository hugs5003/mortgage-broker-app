/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL?: string
	readonly VITE_USE_CLIENT_MOCK_DEALS?: string
	readonly VITE_GA_MEASUREMENT_ID?: string
	readonly VITE_META_PIXEL_ID?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

// Global analytics functions injected by GA4 and Meta Pixel snippets in index.html
declare function gtag(command: string, ...args: unknown[]): void
declare function fbq(command: string, ...args: unknown[]): void
