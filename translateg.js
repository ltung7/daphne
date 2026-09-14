/**
 * translate.js
 *
 * Reads the Paraglide/inlang `messages/` folder, diffs every locale file
 * against a base locale (default: "en"), and uses Gemini to translate any
 * keys missing (or blank) in the target files, then writes them back.
 *
 * Usage:
 *   node translate.js                  # base = en, dir = ./messages
 *   node translate.js pl               # positional base locale
 *   node translate.js --base=en
 *   node translate.js --dir=./messages
 *   node translate.js --model=gemini-2.5-flash
 *   node translate.js --dry-run        # translate but don't write files
 *
 * Requires in package.json:
 *   "@google/generative-ai": "^0.24.1"
 *   "@inlang/paraglide-js": "^2.18.2"
 *
 * Requires a .env file (in cwd) with:
 *   GEMINI_API_KEY=xxxxx
 */

import fs from "node:fs";
import path from "node:path";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ---------------------------------------------------------------------------
// tiny .env loader (avoids pulling in an extra "dotenv" dependency)
// ---------------------------------------------------------------------------
function loadEnv(envPath = ".env") {
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, "utf-8");
    for (const rawLine of content.split("\n")) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const idx = line.indexOf("=");
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        let value = line.slice(idx + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = value;
    }
}

loadEnv();

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const rawArgs = process.argv.slice(2);
const flags = rawArgs.filter((a) => a.startsWith("--"));
const positional = rawArgs.filter((a) => !a.startsWith("--"));

function getFlag(name, fallback) {
    const prefix = `--${name}=`;
    const found = flags.find((a) => a.startsWith(prefix));
    return found ? found.slice(prefix.length) : fallback;
}

const BASE_LOCALE = getFlag("base", positional[0] ?? "en");
const MESSAGES_DIR = path.resolve(getFlag("dir", "./messages"));
const MODEL_NAME = getFlag("model", process.env.GEMINI_MODEL ?? "gemini-2.5-flash");
const DRY_RUN = flags.includes("--dry-run");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY (checked process.env and .env).");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
        responseMimeType: "application/json",
    },
});

// ---------------------------------------------------------------------------
// json helpers
// ---------------------------------------------------------------------------
function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

/** Flatten a (possibly nested) message tree into "dot.path" -> string. Skips "$"-prefixed keys (e.g. $schema). */
function flatten(tree, prefix = "") {
    const out = {};
    for (const [ key, value ] of Object.entries(tree)) {
        if (key.startsWith("$")) continue;
        const dotPath = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "string") {
            out[dotPath] = value;
        } else if (value && typeof value === "object") {
            Object.assign(out, flatten(value, dotPath));
        }
    }
    return out;
}

/** Write a value into a nested tree at a dot-path, creating intermediate objects as needed. */
function setPath(tree, dotPath, value) {
    const parts = dotPath.split(".");
    let node = tree;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (typeof node[part] !== "object" || node[part] === null) {
            node[part] = {};
        }
        node = node[part];
    }
    node[parts[parts.length - 1]] = value;
}

/** True if a dot-path exists in the tree AND holds a non-empty string. */
function hasValue(tree, dotPath) {
    const parts = dotPath.split(".");
    let node = tree;
    for (const part of parts) {
        if (node == null || typeof node !== "object" || !(part in node)) return false;
        node = node[part];
    }
    return typeof node === "string" && node.trim().length > 0;
}

function chunk(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
}

// ---------------------------------------------------------------------------
// translation
// ---------------------------------------------------------------------------
const SYSTEM_CONTEXT = `
You are a professional localization translator working on a job listings / job board web application (browsing job postings, applying to jobs, employer dashboards, search filters like salary/location/remote/contract type, notifications, account settings, etc).

Rules:
- Translate the given UI strings from locale "${BASE_LOCALE}" into the target locale.
- Preserve any placeholders exactly as-is, including ICU-style syntax such as {name}, {count}, {count, plural, one {...} other {...}}, and any HTML tags. Never translate variable/placeholder names.
- Keep translations concise and natural for UI copy (buttons, labels, short messages), matching the professional but approachable tone of a job platform.
- Respect existing capitalization conventions for UI labels in the target language.
- Return ONLY a JSON object mapping each given key to its translated string. Do not add, remove, or rename keys. No commentary, no markdown fences.
`.trim();

async function translateBatch(targetLocale, entries) {
    const keys = Object.keys(entries);
    if (keys.length === 0) return {};

    const prompt = `${SYSTEM_CONTEXT}

Target locale: "${targetLocale}"

Strings to translate (JSON, key -> source text):
${JSON.stringify(entries, null, 2)}

Respond with a JSON object of the same keys mapped to the translated strings.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new Error(
            `Failed to parse Gemini response as JSON for locale "${targetLocale}":\n${text}`
        );
    }

    const missing = keys.filter((k) => !(k in parsed));
    if (missing.length > 0) {
        console.warn(
            `  [${targetLocale}] response was missing keys: ${missing.join(", ")}`
        );
    }

    return parsed;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
    if (!fs.existsSync(MESSAGES_DIR)) {
        console.error(`Messages directory not found: ${MESSAGES_DIR}`);
        process.exit(1);
    }

    const baseFilePath = path.join(MESSAGES_DIR, `${BASE_LOCALE}.json`);
    if (!fs.existsSync(baseFilePath)) {
        console.error(`Base file not found: ${baseFilePath}`);
        process.exit(1);
    }

    const baseTree = readJson(baseFilePath);
    const baseFlat = flatten(baseTree);
    const baseKeys = Object.keys(baseFlat);

    console.log(`Base locale: "${BASE_LOCALE}" (${baseKeys.length} strings) — ${baseFilePath}`);
    console.log(`Model: ${MODEL_NAME}${DRY_RUN ? " (dry run)" : ""}`);

    const localeFiles = fs
        .readdirSync(MESSAGES_DIR)
        .filter((f) => f.endsWith(".json") && f !== `${BASE_LOCALE}.json`);

    if (localeFiles.length === 0) {
        console.log("No other locale files found in messages/. Nothing to do.");
        return;
    }

    for (const file of localeFiles) {
        const locale = path.basename(file, ".json");
        const filePath = path.join(MESSAGES_DIR, file);

        let targetTree;
        try {
            targetTree = readJson(filePath);
        } catch (err) {
            console.warn(`Skipping ${file}: could not parse JSON (${err.message})`);
            continue;
        }

        const missingKeys = baseKeys.filter((key) => !hasValue(targetTree, key));

        if (missingKeys.length === 0) {
            console.log(`[${locale}] up to date.`);
            continue;
        }

        console.log(`[${locale}] ${missingKeys.length} missing string(s), translating...`);

        const toTranslate = {};
        for (const key of missingKeys) toTranslate[key] = baseFlat[key];

        const translated = {};
        for (const batch of chunk(Object.entries(toTranslate), 40)) {
            const result = await translateBatch(locale, Object.fromEntries(batch));
            Object.assign(translated, result);
        }

        let written = 0;
        for (const [ key, value ] of Object.entries(translated)) {
            if (typeof value === "string" && value.trim()) {
                setPath(targetTree, key, value);
                written++;
            }
        }

        if (DRY_RUN) {
            console.log(`[${locale}] dry run — would write ${written} string(s). Preview:`);
            console.log(JSON.stringify(translated, null, 2));
        } else {
            writeJson(filePath, targetTree);
            console.log(`[${locale}] wrote ${written} string(s) -> ${filePath}`);
        }
    }

    console.log("Done.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});