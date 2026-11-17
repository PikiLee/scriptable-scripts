import { FetchScheduleResult } from "./fetch-schedule";
import dayjs from "dayjs";
import { addGamesSection, addScheduleError, addTeamGamesSection, TeamSection, theme } from "./widget-sections";

// Function to create the widget
export function createWidget(fetchScheduleResult: FetchScheduleResult, teams: TeamSection[]) {
    const widget = new ListWidget();
    widget.setPadding(10, 10, 10, 10);

    const gradient = new LinearGradient();
    gradient.colors = [new Color('#1C1F26'), new Color('#0B0C10')];
    gradient.locations = [0, 1];
    gradient.startPoint = new Point(0, 0);
    gradient.endPoint = new Point(1, 1);
    widget.backgroundGradient = gradient;

    // Header: title on the left, updated time on the right
    const header = widget.addStack();
    header.layoutHorizontally();
    header.centerAlignContent();
    header.setPadding(0, 2, 0, 2);

    const title = header.addText('🏀 NBA');
    title.font = Font.heavyRoundedSystemFont(17);
    title.textColor = theme.primary;
    header.addSpacer();

    const updateTime = header.addText(`Updated ${dayjs().format('MM-DD HH:mm')}`);
    updateTime.font = Font.mediumRoundedSystemFont(11);
    updateTime.textColor = theme.secondary;
    widget.addSpacer(8);

    const columns = widget.addStack();
    columns.layoutHorizontally();
    columns.topAlignContent();
    columns.spacing = 6;

    if (fetchScheduleResult.isErr()) {
      addScheduleError(columns, fetchScheduleResult);
    } else {
      addGamesSection(columns, fetchScheduleResult.value);
    }
    for (const team of teams) {
      addTeamGamesSection(columns, team);
    }

    // set refresh interval to 6 hours
    widget.refreshAfterDate = new Date(Date.now() + 6 * 60 * 60 * 1000)

    return widget;
  }
