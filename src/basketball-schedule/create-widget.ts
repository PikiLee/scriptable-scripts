import { FetchScheduleResult } from "./fetch-schedule";
import { IGame } from "./types";
import dayjs from "dayjs";

function addGamesSection(widget: ListWidget, games: IGame[], date: string) {
    const sectionTitle = widget.addText(date);
    sectionTitle.font = Font.boldSystemFont(14);
    sectionTitle.textColor = Color.yellow();
    widget.addSpacer(4);
    
    if (games.length > 0) {
      games.forEach(game => {
        const gameDate = dayjs(game.date);
        const gameTime = gameDate.format('HH:mm');
        const gameText = widget.addText(`${gameTime} - ${game.name}`);
        gameText.font = Font.systemFont(12);
        // Check if it's a Lakers game
        if (game.name.includes('Lakers')) {
          gameText.textColor = new Color('#FDB927'); // Lakers Gold color
        } else {
          gameText.textColor = Color.white();
        }
      });
    } else {
      const noGames = widget.addText('No games scheduled');
      noGames.font = Font.systemFont(12);
      noGames.textColor = Color.gray();
    }
    
    widget.addSpacer(8);
  }

// Function to create the widget
export function createWidget(fetchScheduleResult: FetchScheduleResult) {
    const widget = new ListWidget();
    widget.backgroundColor = new Color('#1E1E1E');
    
    // Title
    const title = widget.addText('🏀 NBA Games');
    title.font = Font.boldSystemFont(16);
    title.textColor = Color.white();
    title.centerAlignText();
    widget.addSpacer(8);

    // Updated Time
    const updateTime = widget.addText(`Updated at ${dayjs().format('MM-DD HH:mm')}`);
    updateTime.font = Font.systemFont(12);
    updateTime.textColor = Color.gray();
    updateTime.centerAlignText();
    widget.addSpacer(4);


    if (fetchScheduleResult.isErr()) {
        const error = fetchScheduleResult.error;
        let errorText;
        if (error.tag === "VALIDATION_ERROR") {
            errorText = widget.addText('Invalid schedule data');
            console.log(error.zodError.message);
        } else {
            errorText = widget.addText('Error fetching schedule');
        }
        errorText.font = Font.systemFont(12);
        errorText.textColor = Color.red();
        errorText.centerAlignText();
    } else {
        for (const [scheduleDay, games] of Object.entries(fetchScheduleResult.value).slice(0, 3)) {
            addGamesSection(widget, games, scheduleDay);
        }
    }

  
    // set refresh interval to 6 hours
    widget.refreshAfterDate = new Date(Date.now() + 6 * 60 * 60 * 1000)
    
    return widget;
  }