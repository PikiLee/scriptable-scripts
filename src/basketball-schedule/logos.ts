import { ISchedule } from "./types";

// Team logos keyed by ESPN abbreviation (e.g. "LAL")
export type Logos = Record<string, Image>;

const fm = FileManager.local();
const cacheDir = fm.joinPath(fm.cacheDirectory(), 'nba-team-logos');

// Dark-background logo, resized by ESPN's image combiner (64px covers ~20pt at 3x)
function logoURL(abbr: string) {
  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500-dark/${abbr.toLowerCase()}.png&h=64&w=64`;
}

// Logos rarely change, so each one is downloaded once and then read from the cache
async function loadLogo(abbr: string): Promise<Image | undefined> {
  const path = fm.joinPath(cacheDir, `${abbr.toLowerCase()}.png`);
  if (fm.fileExists(path)) return fm.readImage(path);
  try {
    const image = await new Request(logoURL(abbr)).loadImage();
    fm.writeImage(path, image);
    return image;
  } catch {
    return undefined;
  }
}

// Load logos for every team appearing in the given schedules; teams whose logo fails are left out
export async function loadLogos(schedules: ISchedule[]): Promise<Logos> {
  if (!fm.fileExists(cacheDir)) fm.createDirectory(cacheDir, true);

  const abbrs = new Set<string>();
  for (const schedule of schedules) {
    for (const game of Object.values(schedule).flat()) {
      for (const competitor of game.competitions[0]?.competitors ?? []) {
        abbrs.add(competitor.team.abbreviation);
      }
    }
  }

  const logos: Logos = {};
  await Promise.all([...abbrs].map(async abbr => {
    const logo = await loadLogo(abbr);
    if (logo) logos[abbr] = logo;
  }));
  return logos;
}
