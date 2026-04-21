import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

export function loadFixture(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

export function loadJsonFixture<T>(relativePath: string): T {
  return JSON.parse(loadFixture(relativePath)) as T;
}
