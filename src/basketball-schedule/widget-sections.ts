import { ICompetitor, IGame, ISchedule } from "./types";
import { FetchScheduleResult } from "./fetch-schedule";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
dayjs.extend(isToday)

export const theme = {
  card: new Color('#FFFFFF', 0.07),
  primary: Color.white(),
  secondary: new Color('#A1A1AA'),
  today: new Color('#FF9F0A'),
  win: new Color('#30D158'),
  loss: new Color('#FF453A'),
};

export type TeamSection = {
  name: string;
  abbr: string;
  color: string;
  result: FetchScheduleResult;
};

// Team card height budget (pt), measured from a rendered large widget
const TEAM_CARD_OVERHEAD = 86; // widget padding, header, card padding, team title
const TEAM_GAME_HEIGHT = 36;   // date line + matchup line + spacing
const TEAM_RESULT_HEIGHT = 16; // extra line for a started game's score

// Large widget height in points, by screen width (Apple's published widget sizes)
function largeWidgetHeight(): number {
  const { width, height } = Device.screenSize();
  const w = Math.min(width, height);
  if (w >= 428) return 382;
  if (w >= 414) return 376;
  if (w >= 390) return 354;
  return 335;
}
// Fixed so the all-games card gets the remaining width
const TEAM_CARD_WIDTH = 92;
// Rough line budget for the all-games card, so it never overflows the widget
const MAX_LINES = 17;
const DAY_HEADER_LINES = 1.5;

function addText(stack: WidgetStack, text: string, font: Font, color: Color): WidgetText {
  const t = stack.addText(text);
  t.font = font;
  t.textColor = color;
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.7;
  return t;
}

function addRow(parent: WidgetStack, spacing = 4): WidgetStack {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  row.spacing = spacing;
  return row;
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

function addDayHeader(stack: WidgetStack, date: string) {
  const d = dayjs(date);
  const isToday = d.isToday();
  const label = isToday ? `TODAY · ${d.format('MM-DD')}` : d.format('ddd MM-DD').toUpperCase();
  addText(stack, label, Font.boldRoundedSystemFont(12), isToday ? theme.today : theme.secondary);
  stack.addSpacer(2);
}

// One line per game: "08:00  ORL @ CHA" or "ORL 115 @ CHA 120" (winner highlighted)
function addGameRow(stack: WidgetStack, game: IGame) {
  const { home, away, homeWins, awayWins } = getCompetitors(game);
  if (!home || !away) return;

  const row = addRow(stack);
  const font = Font.mediumRoundedSystemFont(13);

  if (!hasStarted(game, home, away)) {
    addText(row, formatTime(game), Font.mediumMonospacedSystemFont(12), theme.secondary);
    addText(row, `${teamLabel(away, awayWins)} @ ${teamLabel(home, homeWins)}`, font, theme.primary);
    return;
  }

  const completed = game.status.type.completed;
  const awayWon = Number(away.score) > Number(home.score);
  const colorFor = (won: boolean) => !completed || won ? theme.primary : theme.secondary;
  const fontFor = (won: boolean) => completed && won ? Font.boldRoundedSystemFont(13) : font;

  if (!completed) addText(row, '●', Font.systemFont(8), theme.loss);
  addText(row, `${teamLabel(away, awayWins)} ${away.score}`, fontFor(awayWon), colorFor(awayWon));
  addText(row, '@', font, theme.secondary);
  addText(row, `${teamLabel(home, homeWins)} ${home.score}`, fontFor(!awayWon), colorFor(!awayWon));
}

export function addGamesSection(parent: WidgetStack, schedule: ISchedule) {
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
    games.forEach(game => addGameRow(list, game));
  }

  // Stretch: this card takes the leftover width and the full height
  const filler = addRow(card);
  filler.addSpacer();
  card.addSpacer();
}

// "11-18 · 12:00" / "vs CHA"; a started game drops the time and adds a score line: "TODAY" / "@ BKN" / "W 135-123"
function addTeamGameRow(stack: WidgetStack, game: IGame, teamAbbr: string) {
  const { home, away } = getCompetitors(game);
  if (!home || !away) return;

  const isHome = home.team.abbreviation === teamAbbr;
  const us = isHome ? home : away;
  const them = isHome ? away : home;
  const d = dayjs(game.date);
  const isToday = d.isToday();
  const started = hasStarted(game, home, away);
  const completed = game.status.type.completed;

  const item = stack.addStack();
  item.layoutVertically();

  const meta = addRow(item, 3);
  const metaFont = Font.semiboldRoundedSystemFont(11);
  addText(meta, isToday ? 'TODAY' : d.format('MM-DD'), metaFont, isToday ? theme.today : theme.secondary);
  if (!started) addText(meta, `· ${formatTime(game)}`, metaFont, theme.secondary);

  addText(item, `${isHome ? 'vs' : '@'} ${them.team.abbreviation}`, Font.semiboldRoundedSystemFont(14), theme.primary);

  if (started) {
    const won = Number(us.score) > Number(them.score);
    const result = completed ? `${won ? 'W' : 'L'} ${us.score}-${them.score}` : `LIVE ${us.score}-${them.score}`;
    addText(item, result, Font.boldRoundedSystemFont(13), !completed ? theme.today : won ? theme.win : theme.loss);
  }
}

export function addTeamGamesSection(parent: WidgetStack, team: TeamSection) {
  const card = addCard(parent);
  card.size = new Size(TEAM_CARD_WIDTH, 0);

  const header = addRow(card, 5);
  const bar = header.addStack();
  bar.size = new Size(3, 12);
  bar.cornerRadius = 1.5;
  bar.backgroundColor = new Color(team.color);
  addText(header, team.name, Font.boldRoundedSystemFont(14), theme.primary);
  card.addSpacer(6);

  if (team.result.isErr()) {
    addErrorText(card, team.result);
  } else {
    // Show as many games as fit in the card's height
    const budget = largeWidgetHeight() - TEAM_CARD_OVERHEAD;
    const games: IGame[] = [];
    let used = 0;
    for (const game of Object.values(team.result.value).flat()) {
      const { home, away } = getCompetitors(game);
      const cost = TEAM_GAME_HEIGHT + (home && away && hasStarted(game, home, away) ? TEAM_RESULT_HEIGHT : 0);
      if (used + cost > budget) break;
      used += cost;
      games.push(game);
    }
    const list = card.addStack();
    list.layoutVertically();
    list.spacing = 7;
    if (games.length === 0) {
      addText(list, 'No games', Font.mediumRoundedSystemFont(13), theme.secondary);
    }
    games.forEach(game => addTeamGameRow(list, game, team.abbr));
  }

  card.addSpacer();
}

export function addScheduleError(parent: WidgetStack, result: FetchScheduleResult) {
  const card = addCard(parent);
  addErrorText(card, result);
  card.addSpacer();
}
