import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		svelte(),
		VitePWA({
			registerType: 'prompt',
			workbox: {
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/rsms\.me\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'runtime-cache',
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
				],
				skipWaiting: true,
			},
			manifest: {
				name: 'soundboard',
				short_name: 'soundboard',
				description: 'Play local sounds in a grid',
				theme_color: '#000000',
				icons: [
					{
						src: '/favicon.svg',
						sizes: 'any',
						type: 'image/svg+xml',
					},
				],
				display: 'standalone',
				start_url: '/',
			},
		}),
	],
	define: {
		BUILD_TIME: JSON.stringify(new Date().toISOString()),
	},
	css: {
		preprocessorOptions: {
			scss: {
				// additionalData: '@use "src/variables.scss" as *;',
			},
		},
	},
});
