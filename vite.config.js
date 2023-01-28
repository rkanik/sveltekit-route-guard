import path from 'path'
import typescript from '@rollup/plugin-typescript'

import { defineConfig } from 'vite'
import { typescriptPaths } from 'rollup-plugin-typescript-paths'

export default defineConfig({
	plugins: [],
	resolve: {
		alias: [
			{
				find: '~',
				replacement: path.resolve(__dirname, './src'),
			},
		],
	},
	server: {
		port: 3000,
	},
	build: {
		minify: true,
		manifest: true,
		emptyOutDir: false,
		reportCompressedSize: true,
		lib: {
			name: 'index',
			formats: ['es', 'cjs', 'umd'],
			fileName: (ext) => `index.${ext}.js`,
			entry: path.resolve(__dirname, 'src/index.ts'),
		},
		rollupOptions: {
			external: [],
			plugins: [
				typescriptPaths({
					preserveExtensions: true,
				}),
				typescript({
					sourceMap: false,
					declaration: true,
					outDir: 'dist',
				}),
			],
		},
	},
})
