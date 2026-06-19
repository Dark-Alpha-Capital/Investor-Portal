import { readFileSync, writeFileSync } from "node:fs";

const path = "packages/db/schema.ts";
let s = readFileSync(path, "utf8");

s = s.replace(
  /import \{\s*pgTable,\s*doublePrecision,\s*integer,\s*text,\s*timestamp,\s*boolean,\s*index,\s*uniqueIndex,\s*jsonb,\s*pgEnum,\s*\} from "drizzle-orm\/pg-core";/,
  `import {
  sqliteTable,
  integer,
  text,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";`,
);

const enumRegex =
  /export const (\w+) = pgEnum\("[^"]+",\s*\[([\s\S]*?)\]\);/g;
const enumNames: string[] = [];
s = s.replace(enumRegex, (_, name: string, values: string) => {
  enumNames.push(name);
  const clean = values.replace(/\s+/g, " ").trim();
  return `export const ${name}Values = [${clean}] as const;`;
});

s = s.replace(/pgTable/g, "sqliteTable");
s = s.replace(/jsonb\(("[^"]+")\)/g, 'text($1, { mode: "json" })');
s = s.replace(/doublePrecision/g, "real");
s = s.replace(/boolean\(("[^"]+")\)/g, 'integer($1, { mode: "boolean" })');
s = s.replace(
  /timestamp\(("[^"]+")\)/g,
  'integer($1, { mode: "timestamp_ms" })',
);

for (const name of enumNames) {
  const colRegex = new RegExp(`${name}\\(("[^"]+")\\)`, "g");
  s = s.replace(colRegex, `text($1, { enum: ${name}Values })`);
}

s = s.replace(/\.defaultNow\(\)/g, ".default(sql`(unixepoch() * 1000)`)");

writeFileSync(path, s);
console.log(`Converted ${enumNames.length} enums`);
