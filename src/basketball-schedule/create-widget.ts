import { FetchScheduleResult } from "./fetch-schedule";
import dayjs from "dayjs";
import { addGamesSection, addTeamGamesSection } from "./widget-sections";

// Function to create the widget
export function createWidget(fetchScheduleResult: FetchScheduleResult) {
    const widget = new ListWidget();
    widget.backgroundColor = new Color('#1E1E1E');
    
    // Title
    const title = widget.addText('🏀 NBA Games');
    title.font = Font.boldSystemFont(16);
    title.textColor = Color.white();
    widget.addSpacer(4);

    // Updated Time
    const updateTime = widget.addText(`Updated at ${dayjs().format('MM-DD HH:mm')}`);
    updateTime.font = Font.systemFont(12);
    updateTime.textColor = Color.gray();
    widget.addSpacer(12);


    const gamesSectionStack = widget.addStack();

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
    } else {
      addGamesSection(gamesSectionStack, fetchScheduleResult.value);
      addTeamGamesSection(gamesSectionStack, fetchScheduleResult.value, 'Lakers');
    }

  
    // set refresh interval to 6 hours
    widget.refreshAfterDate = new Date(Date.now() + 6 * 60 * 60 * 1000)
    
    return widget;
  }