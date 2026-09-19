import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
]);
const markdownLinkPatterns = [
  /!?\[[^\]]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g,
  /^ {0,3}\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm,
];
const externalTargetPattern = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

function removeFencedCode(markdown: string): string {
  let fenceCharacter: "`" | "~" | undefined;
  let fenceLength = 0;

  return markdown
    .split("\n")
    .map((line) => {
      const marker = line.match(/^ {0,3}(`{3,}|~{3,})/)?.[1];

      if (!marker) return fenceCharacter ? "" : line;

      const markerCharacter = marker[0] as "`" | "~";
      if (!fenceCharacter) {
        fenceCharacter = markerCharacter;
        fenceLength = marker.length;
      } else if (markerCharacter === fenceCharacter && marker.length >= fenceLength) {
        fenceCharacter = undefined;
        fenceLength = 0;
      }

      return "";
    })
    .join("\n");
}

function isIgnored(path: string): boolean {
  return path.split("/").some((part) => ignoredDirectories.has(part));
}

function findMarkdownFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = join(directory, entry.name);
    const repositoryPath = relative(root, absolutePath);

    if (isIgnored(repositoryPath)) continue;
    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(absolutePath));
    } else if (entry.isFile() && /\.mdx?$/i.test(entry.name)) {
      files.push(repositoryPath);
    }
  }

  return files;
}

function localPath(linkTarget: string, sourceFile: string): string | undefined {
  const unwrapped =
    linkTarget.startsWith("<") && linkTarget.endsWith(">") ? linkTarget.slice(1, -1) : linkTarget;

  if (externalTargetPattern.test(unwrapped)) return undefined;

  const pathWithoutFragment = unwrapped.split("#", 1)[0]?.split("?", 1)[0];
  if (!pathWithoutFragment) return undefined;

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(pathWithoutFragment);
  } catch {
    return pathWithoutFragment;
  }

  return isAbsolute(decodedPath)
    ? resolve(root, `.${decodedPath}`)
    : resolve(dirname(resolve(root, sourceFile)), decodedPath);
}

const markdownFiles = findMarkdownFiles(root).sort((first, second) => first.localeCompare(second));
const failures: string[] = [];

for (const sourceFile of markdownFiles) {
  const markdown = removeFencedCode(readFileSync(resolve(root, sourceFile), "utf8"));

  for (const pattern of markdownLinkPatterns) {
    for (const match of markdown.matchAll(pattern)) {
      const target = match[1];
      if (!target) continue;

      const resolvedTarget = localPath(target, sourceFile);
      if (resolvedTarget && !existsSync(resolvedTarget)) {
        const line = markdown.slice(0, match.index).split("\n").length;
        failures.push(`${sourceFile}:${line} -> ${target}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error("Broken local Markdown links:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Checked local links in ${markdownFiles.length} Markdown files.`);
