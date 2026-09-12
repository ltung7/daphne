import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: [ 'cookie', 'preferredLanguage', 'baseLocale' ],
			emitTsDeclarations: true
		})
	],
	test: { include: [ 'src/**/*.{test,spec}.{js,ts}' ] }
});
