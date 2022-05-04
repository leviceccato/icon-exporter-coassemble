import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
    plugins: [vue(), viteSingleFile()],
    clearScreen: false,
    build: {
        cssCodeSplit: false,
        assetsInlineLimit: 100000000,
        rollupOptions: {
            input: {
                index: 'index.html',
                code: 'figma/code.ts'
            },
            output: {
                entryFileNames: '[name].js'
            }
        }
    }
})