// @ts-nocheck
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import dts from 'vite-plugin-dts'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        dts({
            entryRoot: path.resolve(__dirname),
            // insertTypesEntry: true,
            copyDtsFiles: true,
            outputDir: 'dist-lib',
            // staticImport: true,
            skipDiagnostics: false,
            insertTypesEntry: true,
            tsConfigFilePath: fileURLToPath(new URL('./tsconfig.lib.json', import.meta.url)),
        }),
        vue()
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        },
    },
    build: {
        sourcemap: true,
        emptyOutDir: true,
        minify: false,
        lib: {
            // entry: path.resolve(__dirname, 'src/lib.ts'),
            entry: fileURLToPath(new URL('./src/lib.ts', import.meta.url)),
            name: 'twitch-vod-chat',
            fileName: 'twitch-vod-chat',
            formats: ['es', 'cjs'],
        },
        rollupOptions: {
            external: ['vue'],
            output: {
                globals: {
                    vue: 'Vue',
                },
            },
        },
        outDir: 'dist-lib',
    },
})
