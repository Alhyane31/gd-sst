import fs from "node:fs";

const schemaPath = process.argv[2] ?? "./prisma/schema.prisma";
const outPath = process.argv[3] ?? "./mcd.mmd";

const src = fs.readFileSync(schemaPath, "utf8");

// ---------- Utils ----------
const stripComments = (s) =>
  s
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

const esc = (s) => s.replace(/[^\w]/g, "_");

function parseBlocks(kind) {
  // kind: "model" | "enum"
  const re = new RegExp(`\\b${kind}\\s+(\\w+)\\s*\\{([\\s\\S]*?)\\}`, "g");
  const blocks = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    blocks.push({ name: m[1], body: m[2] });
  }
  return blocks;
}

function parseModelFields(modelBody) {
  const body = stripComments(modelBody);
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    // ignore block attributes
    .filter((l) => !l.startsWith("@@"));

  const fields = [];
  for (const line of lines) {
    // field line format: name Type?[] @attrs...
    // skip if it's an attribute line
    if (line.startsWith("@")) continue;

    const m = line.match(/^(\w+)\s+([^\s]+)(\s+.+)?$/);
    if (!m) continue;

    const name = m[1];
    const rawType = m[2]; // e.g. String, String?, String[], ModelName?, Json?
    const attrs = m[3] ?? "";

    const isList = rawType.endsWith("[]");
    const isOptional = rawType.endsWith("?");
    const baseType = rawType.replace(/\[\]$/, "").replace(/\?$/, "");

    const isId = attrs.includes("@id");
    const isUnique = attrs.includes("@unique");

    // detect relation field: has @relation OR type is another model (we'll decide later)
    const rel = attrs.match(/@relation(?:\(([^)]*)\))?/);
    const relationArgs = rel?.[1] ?? null;

    // extract relation name if provided: @relation("Name", ...)
    let relationName = null;
    if (relationArgs) {
      const nm = relationArgs.match(/"([^"]+)"/);
      if (nm) relationName = nm[1];
    }

    fields.push({
      name,
      rawType,
      baseType,
      isList,
      isOptional,
      isRequired: !isOptional && !isList, // list is treated separately
      isId,
      isUnique,
      attrs,
      relationName,
    });
  }
  return fields;
}

function mermaidType(baseType, enumsSet) {
  const map = {
    String: "string",
    Int: "int",
    BigInt: "bigint",
    Float: "float",
    Decimal: "decimal",
    Boolean: "boolean",
    DateTime: "datetime",
    Json: "json",
    Bytes: "bytes",
  };
  if (enumsSet.has(baseType)) return `enum:${baseType}`;
  return map[baseType] ?? baseType.toLowerCase();
}

/**
 * Mermaid ER cardinalities:
 *  || one and only one
 *  |o zero or one
 *  }| one or more
 *  }o zero or more
 */
function cardFromField(f) {
  if (f.isList) return "}o";      // 0..n
  if (f.isOptional) return "|o";  // 0..1
  return "||";                   // 1..1
}

// ---------- Parse schema ----------
const enumBlocks = parseBlocks("enum");
const enumsSet = new Set(enumBlocks.map((e) => e.name));

const modelBlocks = parseBlocks("model");
const models = new Map(); // name -> { fields: [...] }

for (const b of modelBlocks) {
  models.set(b.name, { name: b.name, fields: parseModelFields(b.body) });
}

// Identify which field types are model relations
const modelNames = new Set(models.keys());

// Build relation index by relationName if present, else by pair inference
const relFields = []; // { fromModel, field }
for (const m of models.values()) {
  for (const f of m.fields) {
    if (modelNames.has(f.baseType)) {
      relFields.push({ fromModel: m.name, field: f });
    }
  }
}

// Find reverse field
function findReverse(fromModel, field) {
  const toModel = field.baseType;
  const target = models.get(toModel);
  if (!target) return null;

  // If relationName exists, match it
  if (field.relationName) {
    return (
      target.fields.find(
        (tf) =>
          tf.baseType === fromModel && tf.relationName === field.relationName
      ) ?? null
    );
  }

  // Else try to find a field that points back to fromModel (first match)
  return target.fields.find((tf) => tf.baseType === fromModel) ?? null;
}

// ---------- Emit Mermaid ----------
let out = [];
out.push("```mermaid");
out.push("erDiagram");

// Entities
for (const m of models.values()) {
  out.push(`  ${esc(m.name)} {`);
  for (const f of m.fields) {
    // only scalar/enum fields inside entity box
    if (modelNames.has(f.baseType)) continue;

    const t = mermaidType(f.baseType, enumsSet);
    const list = f.isList ? "[]" : "";
    const opt = f.isOptional ? "?" : "";
    const pk = f.isId ? " PK" : "";
    const uq = f.isUnique ? " UK" : "";

    out.push(`    ${t}${list}${opt} ${esc(f.name)}${pk}${uq}`);
  }
  out.push("  }");
  out.push("");
}

// Relations (dedupe)
const seen = new Set();

for (const { fromModel, field } of relFields) {
  const toModel = field.baseType;
  const rev = findReverse(fromModel, field);

  const relLabel = field.relationName ?? `${fromModel}_${toModel}`;

  // stable key
  const key = [fromModel, toModel, relLabel].sort().join("|");
  if (seen.has(key)) continue;
  seen.add(key);

  const left = cardFromField(field);          // from -> to multiplicity
  const right = rev ? cardFromField(rev) : "}o"; // fallback if missing

  out.push(
    `  ${esc(fromModel)} ${left}--${right} ${esc(toModel)} : "${relLabel}"`
  );
}

out.push("```");

fs.writeFileSync(outPath, out.join("\n"), "utf8");
console.log(`✅ MCD Mermaid generated: ${outPath}`);