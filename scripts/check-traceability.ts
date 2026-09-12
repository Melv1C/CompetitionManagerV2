import { existsSync } from "node:fs";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dir, "..");
const specificationPath = resolve(repositoryRoot, "docs/competition-manager-rewrite-agent-spec.md");
const traceabilityPath = resolve(repositoryRoot, "docs/traceability.md");

const specification = await Bun.file(specificationPath).text();
const traceability = await Bun.file(traceabilityPath).text();

const expectedIds = [...specification.matchAll(/^\|\s*([A-Z]+-\d{3})\s*\|/gm)]
  .map((match) => match[1])
  .filter((id): id is string => Boolean(id));
const matrixHeader = "| ID | Requirement | Implementation location | Test evidence | Status |";
const matrixStart = traceability.indexOf(matrixHeader);

if (matrixStart === -1) {
  console.error(`Traceability matrix header not found in ${traceabilityPath}`);
  process.exit(1);
}

const matrixRows = traceability
  .slice(matrixStart + matrixHeader.length)
  .split("\n")
  .filter((line) => /^\|\s*[A-Z]+-\d{3}\s*\|/.test(line));

const rows = matrixRows.map((line) =>
  line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim()),
);
const actualIds = rows.map((row) => row[0]).filter((id): id is string => Boolean(id));
const errors: string[] = [];

const duplicates = actualIds.filter((id, index) => actualIds.indexOf(id) !== index);
if (duplicates.length > 0) {
  errors.push(`duplicate requirement IDs: ${[...new Set(duplicates)].join(", ")}`);
}

const missingIds = expectedIds.filter((id) => !actualIds.includes(id));
if (missingIds.length > 0) {
  errors.push(`missing requirement IDs: ${missingIds.join(", ")}`);
}

const unexpectedIds = actualIds.filter((id) => !expectedIds.includes(id));
if (unexpectedIds.length > 0) {
  errors.push(`unexpected requirement IDs: ${[...new Set(unexpectedIds)].join(", ")}`);
}

for (const [index, row] of rows.entries()) {
  if (row.length !== 5) {
    errors.push(`row ${index + 1} (${row[0] ?? "unknown"}) must have five columns`);
  }
}

const implementationHasStarted =
  process.env.TRACEABILITY_IMPLEMENTATION_STARTED === "1" ||
  existsSync(resolve(repositoryRoot, "apps")) ||
  existsSync(resolve(repositoryRoot, "packages"));

if (implementationHasStarted) {
  const placeholder = /^(?:—|-|tbd|todo|none|n\/a|not yet|planned)(?:\s|$)/i;
  for (const row of rows) {
    const id = row[0] ?? "unknown";
    if (
      row.length < 5 ||
      !row[2] ||
      !row[3] ||
      placeholder.test(row[2] ?? "") ||
      placeholder.test(row[3] ?? "")
    ) {
      errors.push(`${id} needs implementation and test references after implementation begins`);
    }
  }
}

if (errors.length > 0) {
  console.error("Traceability check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Traceability check passed: ${actualIds.length} Appendix A requirements mapped${implementationHasStarted ? " with implementation and test references" : " (pre-implementation)"}.`,
);
