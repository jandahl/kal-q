#!/usr/bin/env node
/**
 * GitHub Pages is a static host. TanStack SPA mode emits `_shell.html` for `/`.
 * Copy that shell to `index.html` (site root) and `404.html` (unknown paths).
 */
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "dist/client");
const shell = join(root, "_shell.html");

if (!existsSync(shell)) {
  console.error("[prepare-pages] missing dist/client/_shell.html");
  process.exit(1);
}

const index = join(root, "index.html");
if (!existsSync(index)) copyFileSync(shell, index);
copyFileSync(shell, join(root, "404.html"));
console.log("[prepare-pages] wrote index.html and 404.html");
