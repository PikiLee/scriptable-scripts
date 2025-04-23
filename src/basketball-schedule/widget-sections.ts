import { IGame, ISchedule } from "./types";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
dayjs.extend(isoWeek)

export function addGamesSection(parent: WidgetStack, schedule: ISchedule) {
    const stack = parent.addStack();
    stack.layoutVertically();

    for (const [scheduleDay, games] of Object.entries(schedule).slice(0, 3)) {
        addGamesItem(stack, games, scheduleDay);
    }
}

function addGamesItem(parent: WidgetStack, games: IGame[], date: string) {
    const weekday = dayjs(date).isoWeekday();
    const sectionTitle = parent.addText(`${date} (${weekday})`);
    sectionTitle.font = Font.boldSystemFont(14);
    sectionTitle.textColor = Color.yellow();
    parent.addSpacer(4);
    
    if (games.length > 0) {
      games.forEach(game => {
        const gameDate = dayjs(game.date);
        const gameTime = gameDate.format('HH:mm');
        const gameText = parent.addText(`${gameTime} - ${game.shortName}`);
        gameText.font = Font.systemFont(12);
        gameText.textColor = Color.white();
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
  stack.setPadding(0, 52, 0, 0);

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
