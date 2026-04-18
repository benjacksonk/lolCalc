import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `@use '$lib/styles/sizes'; @use '$lib/styles/fonts'; @use '$lib/styles/colors';`
			}
		}
	}
});
