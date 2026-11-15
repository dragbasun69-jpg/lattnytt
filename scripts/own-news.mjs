// Lätt nytts egna nyheter på lätt svenska.
// Utkast ligger i data/egna/utkast.json och syns bara på utkast.html.
// Publicerade nyheter ligger i data/egna/publicerade.json och syns på sajten.
//
//   node scripts/own-news.mjs --prompt         visar instruktionerna för att skriva nya utkast
//   node scripts/own-news.mjs --add fil.json   kontrollerar och sparar nya utkast
//   node scripts/own-news.mjs --publish        publicerar alla utkast
//   node scripts/own-news.mjs --discard        raderar alla utkast

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "data", "egna");
const DRAFTS = path.join(DIR, "utkast.json");
const PUBLISHED = path.join(DIR, "publicerade.json");
const KEEP_DAYS = 60; // publicerade nyheter sparas i 60 dagar (sajten visar de senaste 14)

const read = async (f) => { try { return JSON.parse(await readFile(f, "utf8")); } catch { return { items: [] }; } };
const write = async (f, d) => { await mkdir(DIR, { recursive: true }); await writeFile(f, JSON.stringify(d, null, 2) + "\n", "utf8"); };
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

const SCHEMA = `{
  "items": [
    {
      "title": "Kort rubrik på lätt svenska",
      "emoji": "En emoji som passar nyheten, t.ex. ❄️",
      "color": "En mörk färg som hex, t.ex. #1d4e89",
      "paragraphs": ["2–5 korta stycken på lätt svenska, högst 400 tecken var"],
      "tip": { "label": "Ord eller Bra att veta eller Gör så här", "text": "En kort förklaring av ett svårt ord eller ett tips" },
      "sources": [{ "title": "Källans namn och vad det är", "url": "https://..." }]
    }
  ]
}`;

const PROMPT = `Skriv 3–4 egna nyheter på lätt svenska till nyhetssajten Lätt nytt. Läsarna är elever som läser svenska som andraspråk och gymnasieelever.

1. Välj veckans viktigaste händelser i Sverige som passar i skolan. Undvik grova brott, död och olyckor med detaljer. Välj olika ämnen (t.ex. samhälle, väder, ekonomi, kultur, teknik, sport).

2. Sök fakta i flera källor. Utgå helst från myndigheter och organisationers egna texter (t.ex. SMHI, Krisinformation, Trafikverket, regeringen, pressmeddelanden) och från flera nyhetsmedier. Varje viktig uppgift ska finnas i minst två källor eller komma direkt från den som står bakom uppgiften.

3. Skriv med EGNA ord. Följ inte någon artikels upplägg eller formuleringar. Kopiera aldrig meningar. Citera inte. Upphovsrätten skyddar texten, inte fakta.

4. Lätt svenska: korta meningar, vanliga ord, en sak i taget. Förklara svåra ord. Skriv datum i stället för "i går" eller "förra veckan".

5. Ta bara med fakta du har kontrollerat. Om källorna säger olika saker, skriv det som stämmer i flest pålitliga källor eller låt bli uppgiften. Inga påhittade siffror, namn eller citat. Var neutral i politiska frågor.

6. Använd inga bilder från andra (sajten visar en emoji och en färg).

7. Spara nyheterna som JSON med exakt den här strukturen och kör sedan: node scripts/own-news.mjs --add <filen>

${SCHEMA}`;

function validate(d) {
  const errs = [];
  if (!Array.isArray(d.items) || d.items.length < 1 || d.items.length > 6) errs.push("items ska ha 1–6 nyheter");
  (d.items || []).forEach((x, i) => {
    const w = `Nyhet ${i + 1}`;
    if (!x.title || x.title.length > 90) errs.push(`${w}: rubrik saknas eller är för lång`);
    if (!Array.isArray(x.paragraphs) || x.paragraphs.length < 2 || x.paragraphs.length > 5) errs.push(`${w}: ska ha 2–5 stycken`);
    (x.paragraphs || []).forEach((p, j) => { if (!p || p.length > 400) errs.push(`${w}, stycke ${j + 1}: tomt eller längre än 400 tecken`); });
    if (!Array.isArray(x.sources) || !x.sources.length) errs.push(`${w}: källor saknas`);
    (x.sources || []).forEach((s, j) => { if (!s.title || !/^https:\/\//.test(s.url || "")) errs.push(`${w}, källa ${j + 1}: titel eller https-länk saknas`); });
    if (x.tip && (!x.tip.label || !x.tip.text)) errs.push(`${w}: tip ska ha label och text`);
    if (x.color && !/^#[0-9a-f]{6}$/i.test(x.color)) errs.push(`${w}: color ska vara hex, t.ex. #1d4e89`);
  });
  return errs;
}

async function main() {
  const [cmd, file] = process.argv.slice(2);

  if (cmd === "--prompt") { console.log(PROMPT); return; }

  if (cmd === "--add") {
    const d = JSON.parse(await readFile(file, "utf8"));
    const errs = validate(d);
    if (errs.length) { console.error("Utkasten klarade inte kontrollen:\n- " + errs.join("\n- ")); process.exit(1); }
    const drafts = await read(DRAFTS);
    const now = new Date().toISOString();
    const day = now.slice(0, 10);
    for (const x of d.items) {
      drafts.items.push({
        id: `${day}-${slug(x.title)}`, title: x.title, emoji: x.emoji || "📰", color: x.color || "#14213d",
        paragraphs: x.paragraphs, tip: x.tip || null, sources: x.sources, written: now,
      });
    }
    await write(DRAFTS, drafts);
    console.log(`Sparade ${d.items.length} utkast. Totalt ${drafts.items.length} utkast väntar på godkännande.`);
    return;
  }

  if (cmd === "--publish") {
    const drafts = await read(DRAFTS);
    if (!drafts.items.length) { console.log("Inga utkast att publicera."); return; }
    const pub = await read(PUBLISHED);
    const now = new Date().toISOString();
    const cutoff = Date.now() - KEEP_DAYS * 864e5;
    const ids = new Set(drafts.items.map((x) => x.id));
    pub.items = [
      ...drafts.items.map(({ written, ...x }) => ({ ...x, date: now })),
      ...pub.items.filter((x) => !ids.has(x.id) && new Date(x.date).getTime() >= cutoff),
    ];
    await write(PUBLISHED, pub);
    await write(DRAFTS, { items: [] });
    console.log(`Publicerade ${drafts.items.length} nyheter.`);
    return;
  }

  if (cmd === "--discard") {
    const drafts = await read(DRAFTS);
    await write(DRAFTS, { items: [] });
    console.log(`Raderade ${drafts.items.length} utkast.`);
    return;
  }

  console.log("Använd --prompt, --add <fil>, --publish eller --discard.");
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
