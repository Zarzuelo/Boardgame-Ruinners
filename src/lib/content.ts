import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const TINA_CLIENT_ID = process.env.TINA_CLIENT_ID || '';
const TINA_TOKEN = process.env.TINA_TOKEN || '';
const TINA_BRANCH = process.env.TINA_BRANCH || process.env.HEAD || 'main';

const MEDIA_ROOT = 'images';

const TINA_CDN_PREFIX = 'https://assets.tina.io/';

function stripMediaRoot(p: string): string {
  return p.startsWith(`${MEDIA_ROOT}/`) ? p.slice(MEDIA_ROOT.length + 1) : p;
}

function resolveMediaUrl(value: string | undefined): string | undefined {
  if (!value || !value.trim()) return undefined;
  if (value.startsWith(TINA_CDN_PREFIX)) {
    let cleaned = value;
    const lastIdx = cleaned.lastIndexOf(TINA_CDN_PREFIX);
    if (lastIdx > 0) {
      cleaned = cleaned.slice(lastIdx);
    }
    const afterPrefix = cleaned.slice(TINA_CDN_PREFIX.length);
    const slashIdx = afterPrefix.indexOf('/');
    if (slashIdx === -1) return cleaned;
    const clientId = afterPrefix.slice(0, slashIdx);
    let rest = afterPrefix.slice(slashIdx + 1);
    while (rest.startsWith(`${TINA_CDN_PREFIX}${clientId}/`)) {
      rest = rest.slice(`${TINA_CDN_PREFIX}${clientId}/`.length);
    }
    return `${TINA_CDN_PREFIX}${clientId}/${stripMediaRoot(rest)}`;
  }
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  const cleanPath = value.startsWith('/') ? value.slice(1) : value;
  const cdnPath = stripMediaRoot(cleanPath);
  if (TINA_CLIENT_ID) {
    return `${TINA_CDN_PREFIX}${TINA_CLIENT_ID}/${cdnPath}`;
  }
  return `/${cleanPath}`;
}

function resolveObject<T extends Record<string, unknown>>(obj: T, keys: string[]): T {
  const result = { ...obj };
  for (const key of keys) {
    if (key in result && typeof result[key] === 'string') {
      (result as Record<string, unknown>)[key] = resolveMediaUrl(result[key] as string);
    }
  }
  return result;
}

export interface LandingData {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    ludoButtonText: string;
    ludoUrl: string;
    salesButtonText: string;
    salesUrl: string;
    videoButtonText: string;
    videoUrl: string;
    backgroundImage?: string;
    coverImage?: string;
  };
  components: {
    badge: string;
    title: string;
    description: string;
    features: Array<{
      title: string;
      description: string;
      icon: string;
      image?: string;
    }>;
  };
  factions: {
    badge: string;
    title: string;
    description: string;
    items: Array<{
      name: string;
      motto: string;
      accentColor: string;
      icon: string;
      image?: string;
      description: string;
    }>;
  };
  rules: {
    badge: string;
    title: string;
    description: string;
    steps: Array<{
      number: string;
      title: string;
      description: string;
      image?: string;
    }>;
  };
  videoBlock: {
    visible: boolean;
    badge: string;
    title: string;
    description: string;
    youtubeUrl: string;
  };
  salesSheet: {
    visible: boolean;
    badge: string;
    title: string;
    description: string;
    spanishLinkText: string;
    spanishUrl: string;
    englishLinkText: string;
    englishUrl: string;
  };
  footer: {
    gameName: string;
    tagline: string;
    copyright: string;
  };
}

function applyMediaUrls(data: LandingData): LandingData {
  data.hero = resolveObject(data.hero, ['backgroundImage', 'coverImage']);

  data.components.features = (data.components.features || []).map((f) => resolveObject(f, ['image']));
  data.factions.items = (data.factions.items || []).map((item) => resolveObject(item, ['image']));
  data.rules.steps = (data.rules.steps || []).map((s) => resolveObject(s, ['image']));
  return data;
}

function readLocalFile(): LandingData {
  const filePath = path.join(process.cwd(), 'src', 'content', 'pages', 'landing.md');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data } = matter(raw) as { data: LandingData };
  return applyMediaUrls(data);
}

const TINA_QUERY_FULL = `query {
  pages(relativePath: "landing.md") {
    hero { badge title subtitle description ludoButtonText ludoUrl salesButtonText salesUrl videoButtonText videoUrl backgroundImage coverImage }
    components { badge title description features { title description icon image } }
    factions { badge title description items { name motto accentColor icon image description } }
    rules { badge title description steps { number title description image } }
    videoBlock { visible badge title description youtubeUrl }
    salesSheet { visible badge title description spanishLinkText spanishUrl englishLinkText englishUrl }
    footer { gameName tagline copyright }
  }
}`;

const TINA_QUERY_LEGACY = `query {
  pages(relativePath: "landing.md") {
    hero { badge title subtitle description ludoButtonText ludoUrl salesButtonText salesUrl videoButtonText videoUrl backgroundImage coverImage }
    components { badge title description features { title description icon image } }
    factions { badge title description items { name motto accentColor icon image description } }
    rules { badge title description steps { number title description image } }
    footer { gameName tagline copyright }
  }
}`;

async function fetchFromTinaCloud(): Promise<LandingData | null> {
  if (!TINA_CLIENT_ID || !TINA_TOKEN) return null;
  const url = `https://content.tinajs.io/1.6/content/${TINA_CLIENT_ID}/github/${TINA_BRANCH}`;
  const local = readLocalFile();
  try {
    let res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': TINA_TOKEN },
      body: JSON.stringify({ query: TINA_QUERY_FULL }),
    });
    let json = (await res.json()) as { data?: { pages?: Partial<LandingData> }; errors?: unknown[] };
    if (json.errors) {
      json = { data: undefined, errors: json.errors };
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': TINA_TOKEN },
        body: JSON.stringify({ query: TINA_QUERY_LEGACY }),
      });
      json = (await res.json()) as { data?: { pages?: Partial<LandingData> }; errors?: unknown[] };
      if (json.errors) {
        console.warn('[Tina] Content API returned errors:', JSON.stringify(json.errors));
        return null;
      }
    }
    if (!json?.data?.pages) return null;
    const pages = json.data.pages as LandingData;
    if (!pages.videoBlock) pages.videoBlock = local.videoBlock;
    if (!pages.salesSheet) pages.salesSheet = local.salesSheet;
    return applyMediaUrls(pages);
  } catch (err) {
    console.warn('[Tina] Content API fetch failed:', err);
    return null;
  }
}

let cachedData: LandingData | null = null;

export async function getLandingData(): Promise<LandingData> {
  if (cachedData) return cachedData;
  const cloudData = await fetchFromTinaCloud();
  if (cloudData) {
    const local = readLocalFile();
    if (!cloudData.hero.backgroundImage) cloudData.hero.backgroundImage = local.hero.backgroundImage;
    if (!cloudData.hero.coverImage) cloudData.hero.coverImage = local.hero.coverImage;
    cachedData = cloudData;
  } else {
    cachedData = readLocalFile();
  }
  return cachedData;
}
