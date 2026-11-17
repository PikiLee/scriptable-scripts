import { ICompetitor, IGame, ISchedule } from "./types";
import { FetchScheduleResult } from "./fetch-schedule";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
dayjs.extend(isToday)

export const theme = {
  card: new Color('#FFFFFF', 0.07),
  primary: Color.white(),
  secondary: new Color('#8E8E93'),
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

const MAX_TEAM_GAMES = 6;
// Rough line budget for the all-games card, so it never overflows the widget
const MAX_LINES = 20;
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
  addText(stack, error.tag === "VALIDATION_ERROR" ? 'Invalid data' : 'Fetch failed', Font.mediumRoundedSystemFont(11), theme.loss);
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
  addText(stack, label, Font.boldRoundedSystemFont(10), isToday ? theme.today : theme.secondary);
  stack.addSpacer(2);
}

// One line per game: "08:00  ORL @ CHA" or "ORL 115 @ CHA 120" (winner highlighted)
function addGameRow(stack: WidgetStack, game: IGame) {
  const { home, away, homeWins, awayWins } = getCompetitors(game);
  if (!home || !away) return;

  const row = addRow(stack);
  const font = Font.mediumRoundedSystemFont(11);

  if (!hasStarted(game, home, away)) {
    addText(row, formatTime(game), Font.mediumMonospacedSystemFont(10), theme.secondary);
    addText(row, `${teamLabel(away, awayWins)} @ ${teamLabel(home, homeWins)}`, font, theme.primary);
    return;
  }

  const completed = game.status.type.completed;
  const awayWon = Number(away.score) > Number(home.score);
  const colorFor = (won: boolean) => !completed || won ? theme.primary : theme.secondary;
  const fontFor = (won: boolean) => completed && won ? Font.boldRoundedSystemFont(11) : font;

  if (!completed) addText(row, '●', Font.systemFont(7), theme.loss);
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
      addText(list, 'No games', Font.mediumRoundedSystemFont(11), theme.secondary);
    }
    games.forEach(game => addGameRow(list, game));
  }

  // Stretch: this card takes the leftover width and the full height
  const filler = addRow(card);
  filler.addSpacer();
  card.addSpacer();
}

// Two lines per game: "WED 11-18 · 12:00" / "vs CHA", or "MON 11-17" / "@ BKN  W 135-123"
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
  const metaFont = Font.semiboldRoundedSystemFont(9);
  addText(meta, isToday ? 'TODAY' : d.format('ddd MM-DD').toUpperCase(), metaFont, isToday ? theme.today : theme.secondary);
  if (!started) addText(meta, `· ${formatTime(game)}`, metaFont, theme.secondary);

  const main = addRow(item);
  addText(main, `${isHome ? 'vs' : '@'} ${them.team.abbreviation}`, Font.semiboldRoundedSystemFont(12), theme.primary);
  if (started) {
    const won = Number(us.score) > Number(them.score);
    const result = completed ? `${won ? 'W' : 'L'} ${us.score}-${them.score}` : `${us.score}-${them.score}`;
    addText(main, result, Font.semiboldRoundedSystemFont(10), !completed ? theme.today : won ? theme.win : theme.loss);
  }
}

export function addTeamGamesSection(parent: WidgetStack, team: TeamSection) {
  const card = addCard(parent);

  const header = addRow(card, 5);
  const bar = header.addStack();
  bar.size = new Size(3, 12);
  bar.cornerRadius = 1.5;
  bar.backgroundColor = new Color(team.color);
  addText(header, team.name, Font.boldRoundedSystemFont(13), theme.primary);
  card.addSpacer(6);

  if (team.result.isErr()) {
    addErrorText(card, team.result);
  } else {
    const games = Object.values(team.result.value).flat().slice(0, MAX_TEAM_GAMES);
    const list = card.addStack();
    list.layoutVertically();
    list.spacing = 6;
    if (games.length === 0) {
      addText(list, 'No games', Font.mediumRoundedSystemFont(11), theme.secondary);
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
