import { ICompetitor, IGame, ISchedule } from "./types";
import { FetchScheduleResult } from "./fetch-schedule";
import { Logos } from "./logos";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
dayjs.extend(isToday)
dayjs.extend(isTomorrow)

export const theme = {
  card: new Color('#FFFFFF', 0.07),
  primary: Color.white(),
  secondary: new Color('#A1A1AA'),
  today: new Color('#FF9F0A'),
  tomorrow: new Color('#64D2FF'),
  win: new Color('#30D158'),
  loss: new Color('#FF453A'),
};

export type TeamSection = {
  name: string;
  abbr: string;
  color: string;
  result: FetchScheduleResult;
};

// Fills a large widget on iPhone Pro Max (scores are shown in the all-games column, not team cards)
const TEAM_GAME_COUNT = 7;
// Fixed so the all-games card gets the remaining width
const TEAM_CARD_WIDTH = 92;
// Rough line budget for the all-games card, so it never overflows the widget
const MAX_LINES = 17;
const DAY_HEADER_LINES = 1.5;

// minScale < 1 lets text shrink to fit; team cards pass 1 so overflow clips the bottom instead of shrinking text
function addText(stack: WidgetStack, text: string, font: Font, color: Color, minScale = 0.7): WidgetText {
  const t = stack.addText(text);
  t.font = font;
  t.textColor = color;
  t.lineLimit = 1;
  t.minimumScaleFactor = minScale;
  return t;
}

function addRow(parent: WidgetStack, spacing = 4): WidgetStack {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  row.spacing = spacing;
  return row;
}

// Team logo (if loaded) followed by a label, e.g. [logo] "ORL 115"
function addTeamChip(parent: WidgetStack, logos: Logos, abbr: string, label: string, font: Font, color: Color, logoSize: number, minScale = 0.7) {
  const chip = addRow(parent, 3);
  const logo = logos[abbr];
  if (logo) chip.addImage(logo).imageSize = new Size(logoSize, logoSize);
  addText(chip, label, font, color, minScale);
}

function addCard(parent: WidgetStack): WidgetStack {
  const card = parent.addStack();
  card.layoutVertically();
  card.backgroundColor = theme.card;
  card.cornerRadius = 12;
  card.setPadding(8, 8, 8, 8);
  return card;
}

function addErrorText(stack: WidgetStack, result: FetchScheduleResult) {
  if (result.isOk()) return;
  const error = result.error;
  if (error.tag === "VALIDATION_ERROR") console.log(error.zodError.message);
  addText(stack, error.tag === "VALIDATION_ERROR" ? 'Invalid data' : 'Fetch failed', Font.mediumRoundedSystemFont(13), theme.loss);
}

function getCompetitors(game: IGame) {
  const competition = game.competitions[0];
  const home = competition?.competitors.find(c => c.homeAway === 'home');
  const away = competition?.competitors.find(c => c.homeAway === 'away');
  const winsOf = (c: ICompetitor | undefined) => competition?.series?.competitors.find(s => s.id === c?.id)?.wins;
  return { home, away, homeWins: winsOf(home), awayWins: winsOf(away) };
}

function hasStarted(game: IGame, home: ICompetitor, away: ICompetitor) {
  return game.status.type.completed || home.score !== '0' || away.score !== '0';
}

function formatTime(game: IGame) {
  return game.status.type.shortDetail.includes('TBD') ? 'TBD' : dayjs(game.date).format('HH:mm');
}

function teamLabel(c: ICompetitor, wins: number | undefined) {
  return `${c.team.abbreviation}${wins !== undefined ? `(${wins})` : ''}`;
}

// Highlight today and tomorrow; other days stay secondary
function dayColor(d: dayjs.Dayjs): Color {
  if (d.isToday()) return theme.today;
  if (d.isTomorrow()) return theme.tomorrow;
  return theme.secondary;
}

function addDayHeader(stack: WidgetStack, date: string) {
  const d = dayjs(date);
  const isToday = d.isToday();
  const dayLabel = d.format('ddd MM-DD').toUpperCase();
  const label = isToday ? `TODAY · ${dayLabel}` : dayLabel;
  addText(stack, label, Font.boldRoundedSystemFont(12), dayColor(d));
  stack.addSpacer(2);
}

const ROW_LOGO_SIZE = 14;

// One line per game, away team first; logos separate the teams instead of "@":
// "08:00 [ORL] [CHA]" or "[ORL] ORL 115 [CHA] CHA 120" (winner highlighted)
function addGameRow(stack: WidgetStack, game: IGame, logos: Logos) {
  const { home, away, homeWins, awayWins } = getCompetitors(game);
  if (!home || !away) return;

  const row = addRow(stack, 6);
  const font = Font.mediumRoundedSystemFont(13);

  if (!hasStarted(game, home, away)) {
    addText(row, formatTime(game), Font.mediumMonospacedSystemFont(12), theme.secondary);
    addTeamChip(row, logos, away.team.abbreviation, teamLabel(away, awayWins), font, theme.primary, ROW_LOGO_SIZE);
    addTeamChip(row, logos, home.team.abbreviation, teamLabel(home, homeWins), font, theme.primary, ROW_LOGO_SIZE);
    return;
  }

  const completed = game.status.type.completed;
  const awayWon = Number(away.score) > Number(home.score);
  const colorFor = (won: boolean) => !completed || won ? theme.primary : theme.secondary;
  const fontFor = (won: boolean) => completed && won ? Font.boldRoundedSystemFont(13) : font;

  if (!completed) addText(row, '●', Font.systemFont(8), theme.loss);
  addTeamChip(row, logos, away.team.abbreviation, `${teamLabel(away, awayWins)} ${away.score}`, fontFor(awayWon), colorFor(awayWon), ROW_LOGO_SIZE);
  addTeamChip(row, logos, home.team.abbreviation, `${teamLabel(home, homeWins)} ${home.score}`, fontFor(!awayWon), colorFor(!awayWon), ROW_LOGO_SIZE);
}

export function addGamesSection(parent: WidgetStack, schedule: ISchedule, logos: Logos) {
  const card = addCard(parent);

  // Fill as many days as fit in the line budget (always at least one)
  let lines = 0;
  let first = true;
  for (const [day, games] of Object.entries(schedule)) {
    const dayLines = DAY_HEADER_LINES + Math.max(games.length, 1);
    if (!first && lines + dayLines > MAX_LINES) break;
    if (!first) card.addSpacer(6);
    first = false;
    lines += dayLines;

    addDayHeader(card, day);
    const list = card.addStack();
    list.layoutVertically();
    list.spacing = 2;
    if (games.length === 0) {
      addText(list, 'No games', Font.mediumRoundedSystemFont(13), theme.secondary);
    }
    games.forEach(game => addGameRow(list, game, logos));
  }

  // Stretch: this card takes the leftover width and the full height
  const filler = addRow(card);
  filler.addSpacer();
  card.addSpacer();
}

// "18 WED 12:00" / "vs [logo] CHA" (day of month; other months get a label above); no score, it is in the all-games column
function addTeamGameRow(stack: WidgetStack, game: IGame, teamAbbr: string, logos: Logos) {
  const { home, away } = getCompetitors(game);
  if (!home || !away) return;

  const isHome = home.team.abbreviation === teamAbbr;
  const them = isHome ? away : home;
  const d = dayjs(game.date);

  const item = stack.addStack();
  item.layoutVertically();

  const meta = addRow(item, 3);
  const dateColor = dayColor(d);
  addText(meta, d.format('D'), Font.boldRoundedSystemFont(13), dateColor, 1);
  // Smaller weekday takes the place of the "·" separator; may shrink slightly to fit the narrow card
  addText(meta, d.format('ddd').toUpperCase(), Font.boldRoundedSystemFont(10), dateColor, 0.9);
  addText(meta, formatTime(game), Font.semiboldRoundedSystemFont(13), dateColor, 0.9);

  const opponent = addRow(item, 4);
  const opponentFont = Font.semiboldRoundedSystemFont(14);
  addText(opponent, isHome ? 'vs' : '@', opponentFont, theme.primary, 1);
  // Only shrinks for width (e.g. "UTAH"); the card has no vertical overflow with TEAM_GAME_COUNT games
  addTeamChip(opponent, logos, them.team.abbreviation, them.team.abbreviation, opponentFont, theme.primary, 16, 0.85);
}

export function addTeamGamesSection(parent: WidgetStack, team: TeamSection, logos: Logos) {
  const card = addCard(parent);
  card.size = new Size(TEAM_CARD_WIDTH, 0);
  card.setPadding(8, 6, 8, 6); // narrower sides leave room for the weekday

  const header = addRow(card, 5);
  const teamLogo = logos[team.abbr];
  if (teamLogo) {
    header.addImage(teamLogo).imageSize = new Size(18, 18);
  } else {
    // Fallback when the logo couldn't be loaded
    const bar = header.addStack();
    bar.size = new Size(3, 12);
    bar.cornerRadius = 1.5;
    bar.backgroundColor = new Color(team.color);
  }
  addText(header, team.name, Font.boldRoundedSystemFont(14), theme.primary, 1);
  card.addSpacer(6);

  if (team.result.isErr()) {
    addErrorText(card, team.result);
  } else {
    const games = Object.values(team.result.value).flat().slice(0, TEAM_GAME_COUNT);
    const list = card.addStack();
    list.layoutVertically();
    list.spacing = 7;

    // Games this month need no label; a later month gets one label (e.g. "DEC") before its first game
    let month = dayjs().format('YYYY-MM');
    for (const game of games) {
      const d = dayjs(game.date);
      if (d.format('YYYY-MM') !== month) {
        month = d.format('YYYY-MM');
        addText(list, d.format('MMM').toUpperCase(), Font.boldRoundedSystemFont(11), theme.secondary, 1);
      }
      addTeamGameRow(list, game, team.abbr, logos);
    }
    if (games.length === 0) {
      addText(list, 'No games', Font.mediumRoundedSystemFont(13), theme.secondary);
    }
  }

  card.addSpacer();
}

export function addScheduleError(parent: WidgetStack, result: FetchScheduleResult) {
  const card = addCard(parent);
  addErrorText(card, result);
  card.addSpacer();
}
