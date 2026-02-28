/**
 * parseQuery.js — Enhanced NLP parser for TravelGenie AI
 *
 * Handles UNSTRUCTURED natural-language travel queries, including:
 *   - Multi-destination / multi-leg trips (e.g. "Pune to Thane to Mumbai")
 *   - Single destination with prepositions
 *   - Budget, category, days, travel mode, guide / PHC extraction
 *
 * Returns:
 *   {
 *     destinations: string[],      // ordered list of place names
 *     destination: string|null,     // first destination (backward compat)
 *     budget: number|null,
 *     category: string|null,
 *     days: number|null,
 *     travelMode: string|null,     // "bus" | "train" | "plane" | "car"
 *     guide: boolean,
 *     phc: boolean,                // physically handicapped
 *     raw: string,
 *   }
 */

// ── Category keywords ────────────────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  Temples: [
    "temple", "temples", "shrine", "shrines", "mandir", "spiritual",
    "pilgrimage", "religious", "worship", "sacred", "church", "mosque",
    "gurudwara", "cathedral",
  ],
  Nature: [
    "nature", "forest", "forests", "hill", "hills", "mountain", "mountains",
    "trek", "trekking", "hiking", "wildlife", "waterfall", "waterfalls",
    "valley", "scenic", "green", "lake", "lakes", "garden", "gardens",
    "national park", "sanctuary", "reserve",
  ],
  Malls: [
    "mall", "malls", "shopping", "shop", "shops", "market", "markets",
    "store", "stores", "retail", "wholesale",
  ],
  Beaches: [
    "beach", "beaches", "coast", "coastal", "seaside", "sea", "ocean",
    "shore", "island", "islands", "reef", "coral",
  ],
  Monuments: [
    "monument", "monuments", "heritage", "historical", "historic",
    "museum", "museums", "sculpture", "sculptures", "architecture",
    "gallery", "galleries",
  ],
  Forts: [
    "fort", "forts", "fortress", "citadel", "castle", "castles",
    "fortification", "rampart",
  ],
  Palaces: [
    "palace", "palaces", "royal", "mahal", "mansion",
  ],
  Lakes: [
    "lake", "lakes", "reservoir", "pond", "dam", "backwater", "backwaters",
  ],
  Waterfalls: [
    "waterfall", "waterfalls", "falls", "cascade",
  ],
  Wildlife: [
    "wildlife", "safari", "zoo", "tiger", "birds", "bird watching",
    "national park", "sanctuary", "animal",
  ],
  Adventure: [
    "adventure", "rafting", "paragliding", "bungee", "rock climbing",
    "zip line", "zipline", "scuba", "diving", "surfing", "skiing",
    "kayaking", "rappelling",
  ],
  "Hill Stations": [
    "hill station", "hill stations", "hilltop", "peak", "summit",
    "viewpoint", "view point",
  ],
  Caves: [
    "cave", "caves", "cavern", "grotto", "underground",
  ],
  Gardens: [
    "garden", "gardens", "botanical", "park", "parks", "arboretum",
  ],
  Ruins: [
    "ruins", "ruin", "archaeological", "archaeology", "ancient",
    "excavation", "tomb", "tombs",
  ],
};

// Words that should NEVER be treated as destination names
const STOP_WORDS = new Set([
  "the", "a", "an", "some", "any", "my", "your", "our", "i", "we", "me",
  "temples", "temple", "beaches", "beach", "nature", "malls", "mall",
  "monuments", "monument", "shopping", "heritage", "places", "spots",
  "trip", "travel", "budget", "days", "day", "rupees", "inr",
  "under", "within", "below", "above", "around", "about",
  "for", "with", "and", "plan", "show", "find", "search",
  "want", "looking", "explore", "visit", "go", "going",
  "need", "bus", "train", "flight", "plane", "car", "vehicle",
  "guide", "disabled", "handicapped", "phc", "wheelchair",
  "from", "via", "through", "then", "next", "after",
]);

// ── Multi-destination extraction ─────────────────────────────────────────
function extractDestinations(query) {
  const destinations = [];

  // Pattern 1: "X to Y to Z" or "X - Y - Z" chains
  const chainPattern = /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s*(?:to|->|→|–|-|then|via|and then)\s*/gi;
  const chainMatches = [...query.matchAll(chainPattern)];
  if (chainMatches.length >= 2) {
    for (const m of chainMatches) {
      const name = m[1].trim();
      if (!STOP_WORDS.has(name.toLowerCase()) && name.length > 2) {
        destinations.push(name);
      }
    }
    // Also get the LAST destination after the final separator
    const lastSep = chainMatches[chainMatches.length - 1];
    const afterLast = query.slice(lastSep.index + lastSep[0].length);
    const trailingMatch = afterLast.match(/^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/);
    if (trailingMatch) {
      const name = trailingMatch[1].trim();
      if (!STOP_WORDS.has(name.toLowerCase()) && name.length > 2) {
        destinations.push(name);
      }
    }
    if (destinations.length >= 2) return destinations;
  }

  // Pattern 2: "from X to Y"
  const fromTo = query.match(
    /from\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+to\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i
  );
  if (fromTo) {
    const a = fromTo[1].trim();
    const b = fromTo[2].trim();
    if (!STOP_WORDS.has(a.toLowerCase())) destinations.push(a);
    if (!STOP_WORDS.has(b.toLowerCase())) destinations.push(b);
    if (destinations.length >= 2) return destinations;
  }

  // Pattern 3: Standard single-destination extraction (preposition + place)
  const patterns = [
    /(?:to|in|near|around|at|visit|explore|from)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/g,
    /(?:to|in|near|around|at|visit|explore|from)\s+([a-zA-Z]{3,}(?:\s+[a-zA-Z]{3,})*)/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(query)) !== null) {
      const candidate = match[1].trim();
      const words = candidate.split(/\s+/);
      const meaningful = words.filter((w) => !STOP_WORDS.has(w.toLowerCase()));
      if (meaningful.length > 0) {
        const name = meaningful.join(" ");
        if (!destinations.includes(name)) {
          destinations.push(name);
        }
      }
    }
    if (destinations.length > 0) break;
  }

  return destinations;
}

// ── Budget extraction ────────────────────────────────────────────────────
function extractBudget(query) {
  const patterns = [
    /₹\s?([\d,]+)/i,
    /rs\.?\s?([\d,]+)/i,
    /inr\s?([\d,]+)/i,
    /([\d,]+)\s*(?:rupees?|rs|inr|budget)/i,
    /budget\s*(?:of\s*)?([\d,]+)/i,
    /(?:under|within|below|upto|up\s*to|max|maximum)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i,
    /([\d]+)\s*k\b/i,
    /\$\s?([\d,]+)/i,
  ];
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      let num = match[1].replace(/,/g, "");
      if (/k$/i.test(match[0])) return parseInt(num, 10) * 1000;
      return parseInt(num, 10);
    }
  }
  return null;
}

// ── Category extraction ──────────────────────────────────────────────────
function extractCategory(query) {
  const lower = query.toLowerCase();
  const scored = [];
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += kw.length;
    }
    if (score > 0) scored.push({ category, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.category);
}

// ── Days extraction ──────────────────────────────────────────────────────
function extractDays(query) {
  const patterns = [
    /(\d+)\s*(?:days?|nights?)/i,
    /(\d+)\s*-\s*day/i,
    /for\s+(\d+)\s+day/i,
  ];
  for (const p of patterns) {
    const m = query.match(p);
    if (m) return parseInt(m[1], 10);
  }
  if (/\ba\s+week\b/i.test(query)) return 7;
  if (/\b(\d+)\s+weeks?\b/i.test(query)) {
    return parseInt(query.match(/(\d+)\s+weeks?/i)[1], 10) * 7;
  }
  return null;
}

// ── Travel mode extraction ───────────────────────────────────────────────
function extractTravelMode(query) {
  const lower = query.toLowerCase();
  if (/\b(bus|redbus|abhi\s*bus|state\s*bus)\b/.test(lower)) return "bus";
  if (/\b(train|railway|irctc|rail)\b/.test(lower)) return "train";
  if (/\b(flight|fly|plane|airplane|air)\b/.test(lower)) return "plane";
  if (/\b(car|cab|taxi|drive|own\s*vehicle|self\s*drive|fuel)\b/.test(lower)) return "car";
  return null;
}

// ── Guide / PHC extraction ───────────────────────────────────────────────
function extractGuide(query) {
  const lower = query.toLowerCase();
  return /\b(guide|guided|with\s+guide)\b/.test(lower);
}

function extractPHC(query) {
  const lower = query.toLowerCase();
  return /\b(phc|handicapped|disabled|wheelchair|accessible|disability|specially\s*abled)\b/.test(lower);
}

// ── Main parse function ──────────────────────────────────────────────────
export default function parseQuery(raw) {
  const query = raw.trim();
  const destinations = extractDestinations(query);
  const phc = extractPHC(query);
  return {
    destinations,
    destination: destinations[0] || null,
    budget: extractBudget(query),
    category: extractCategory(query)[0] || null,  // backward compat
    categories: extractCategory(query),             // new: array of all matched
    days: extractDays(query),
    travelMode: extractTravelMode(query),
    guide: extractGuide(query) || phc,
    phc,
    raw: query,
  };
}
