import { ICompetitor, IGame, ISchedule } from "./types";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isToday from "dayjs/plugin/isToday";
dayjs.extend(isoWeek)
dayjs.extend(isToday)

export function addGamesSection(parent: WidgetStack, schedule: ISchedule) {
    const stack = parent.addStack();
    stack.layoutVertically();

    for (const [scheduleDay, games] of Object.entries(schedule).slice(0, 3)) {
        addGamesItem(stack, games, scheduleDay);
    }
}

function formatGameText(competitor: ICompetitor, score: string | undefined, wins: number | undefined): string | undefined {
  return `${competitor.team.abbreviation}${score !== undefined && score !== '0' ? ` ${score}` : ''}${wins !== undefined ? `(${wins})` : ''}`
}

function addGamesItem(parent: WidgetStack, games: IGame[], date: string) {
    const weekday = dayjs(date).isoWeekday();
    const sectionTitle = parent.addText(`${date} (${weekday})`);
    sectionTitle.font = Font.boldSystemFont(14);
    parent.addSpacer(4);

    const isToday = dayjs(date).isToday();
    if (isToday) {
        sectionTitle.textColor = Color.green();
    } else {
        sectionTitle.textColor = Color.yellow();
    }
    
    if (games.length > 0) {
      games.forEach(game => {
        const isTBD = game.status.type.shortDetail.includes('TBD');
        const gameDate = dayjs(game.date);
        const gameTime = isTBD ? 'TBD' : gameDate.format('HH:mm');
        const homeTeam = game.competitions[0]?.competitors.find(competitor => competitor.homeAway === 'home');
        const homeTeamWins = game.competitions[0]?.series?.competitors.find(competitor => competitor.id === homeTeam?.id)?.wins;
        const awayTeam = game.competitions[0]?.competitors.find(competitor => competitor.homeAway === 'away');
        const awayTeamWins = game.competitions[0]?.series?.competitors.find(competitor => competitor.id === awayTeam?.id)?.wins;
        if (!homeTeam || !awayTeam) return;
        const gameText = parent.addText(`${gameTime} ${formatGameText(awayTeam, awayTeam.score, awayTeamWins)} @ ${formatGameText(homeTeam, homeTeam.score, homeTeamWins)}`);
        gameText.font = Font.systemFont(12);
        if (game.status.type.completed) {
            gameText.textColor = Color.green();
        } else {
            gameText.textColor = Color.white();
        }
      });
    } else {
      const noGames = parent.addText('No games scheduled');
      noGames.font = Font.systemFont(12);
      noGames.textColor = Color.gray();
    }
    
    parent.addSpacer(8);
  }

export function addTeamGamesSection(parent: WidgetStack, schedule: ISchedule, teamName: string) {
  const stack = parent.addStack();
  stack.layoutVertically();
  stack.setPadding(0, 12, 0, 0);

  const sectionTitle = stack.addText(teamName);
  sectionTitle.font = Font.boldSystemFont(14);
  sectionTitle.textColor = Color.white();
  stack.addSpacer(4);

  const teamSchedule: ISchedule = {};
  for (const [scheduleDay, games] of Object.entries(schedule)) {
    const teamGames = games.filter(game => game.name.includes(teamName));
    if (teamGames.length > 0) {
      teamSchedule[scheduleDay] = teamGames;
    }
  }

  addGamesSection(stack, teamSchedule);
}
