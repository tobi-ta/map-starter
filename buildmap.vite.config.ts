import 'dotenv/config';
import { defineConfig } from "vite";
import { getMaps, getMapsOptimizers, getMapsScripts, LogLevel, OptimizeOptions } from "wa-map-optimizer-vite";
import { copyFileSync, mkdirSync, readdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";

const maps = getMaps();

let optimizerOptions: OptimizeOptions = {
    logs: process.env.LOG_LEVEL && process.env.LOG_LEVEL in LogLevel ? LogLevel[process.env.LOG_LEVEL] : LogLevel.NORMAL,
};

if (process.env.TILESET_OPTIMIZATION && process.env.TILESET_OPTIMIZATION === "true") {
    const qualityMin = process.env.TILESET_OPTIMIZATION_QUALITY_MIN ? parseInt(process.env.TILESET_OPTIMIZATION_QUALITY_MIN) : 0.9;
    const qualityMax = process.env.TILESET_OPTIMIZATION_QUALITY_MAX ? parseInt(process.env.TILESET_OPTIMIZATION_QUALITY_MAX) : 1;

    optimizerOptions.output = {
        tileset: {
            compress: {
                quality: [qualityMin, qualityMax],
            }
        }
    }
}

export default defineConfig({
    base: "./",
    build: {
        sourcemap: true,
        rollupOptions: {
            input: {
                ...getMapsScripts(maps),
            },
        },
    },
    plugins: [
        ...(process.env.TILESET_OPTIMIZATION === "true" ? getMapsOptimizers(maps, optimizerOptions) : []),
        {
            name: "copy-map-assets",
            closeBundle() {
                const dist = resolve(__dirname, "dist");
                const tilesetDist = resolve(dist, "tilesets");
                mkdirSync(tilesetDist, { recursive: true });

                // Copy map files
                for (const file of readdirSync(".")) {
                    if (file.endsWith(".tmj")) {
                        copyFileSync(file, resolve(dist, file));
                    }
                }

                // Copy tileset files referenced by maps
                for (const file of readdirSync("tilesets")) {
                    const src = resolve("tilesets", file);
                    if (file.endsWith(".tsx") || file.endsWith(".png")) {
                        copyFileSync(src, resolve(tilesetDist, file));
                    }
                }
            },
        },
    ],
});
