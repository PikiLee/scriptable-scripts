import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
dayjs.extend(isSameOrAfter)

import { IGame, ISchedule, scheduleResponseSchema, teamScheduleResponseSchema } from "./types";
import { err, ok, Result } from "neverthrow";
import { ZodError } from "zod";
import { TaggedError } from "@nakanoaas/tagged-error";

// Helper function to format numbers (e.g., pad with leading zero)
function formatNumber(num: number): string {
  return num.toString().padStart(2, '0');
}

// Function to construct the schedule URL for a specific date
export function constructURL(rawDate: Date): string {
    const date = dayjs(rawDate);
    const year = date.year();
    const month = formatNumber(date.month() + 1);
    const day = formatNumber(date.date());
    const url = `http://cdn.espn.com/core/nba/schedule?dates=${year}${month}${day}&xhr=1&render=false&device=desktop&userab=18`;
    return url;
  }

// Function to fetch schedule data
export async function fetchSchedule(date: Date): Promise<FetchScheduleResult> {
    const url = constructURL(date);
    try {
      const req = new Request(url);
      const json = await req.loadJSON()
      const data = scheduleResponseSchema.safeParse(json);
      if (!data.success) {
        return err(new ValidationError(data.error));
      }
      const games = Object.values(data.data.content.schedule).flatMap((daySchedule) => 'games' in daySchedule ? daySchedule.games : [])

      const schedule = groupGamesByDay(games, date);

      return ok(schedule);
    } catch {
        return err(new RequestError());
    }
  }

// Fetch a single team's full-season schedule, keeping games from `date` onwards
export async function fetchTeamSchedule(teamSlug: string, date: Date): Promise<FetchScheduleResult> {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamSlug}/schedule`;
    try {
      const req = new Request(url);
      const json = await req.loadJSON()
      const data = teamScheduleResponseSchema.safeParse(json);
      if (!data.success) {
        return err(new ValidationError(data.error));
      }
      const games: IGame[] = data.data.events.map(event => ({
        date: event.date,
        name: event.name,
        shortName: event.shortName,
        competitions: event.competitions.map(competition => ({
          competitors: competition.competitors.map(competitor => ({
            id: competitor.id,
            homeAway: competitor.homeAway,
            score: competitor.score?.displayValue ?? '0',
            team: competitor.team,
          })),
          series: competition.series,
        })),
        status: event.competitions[0]?.status ?? { type: { shortDetail: '', completed: false } },
      }));

      return ok(groupGamesByDay(games, date));
    } catch {
        return err(new RequestError());
    }
  }

function groupGamesByDay(games: IGame[], date: Date): ISchedule {
  const schedule: ISchedule = {}

  for (const game of games) {
    const gameDate = dayjs(game.date);
    if (gameDate.isBefore(date, 'day')) continue;

    const gameDay = gameDate.format('YYYY-MM-DD');
    if (!schedule[gameDay]) {
      schedule[gameDay] = [game]
    } else {
      schedule[gameDay].push(game)
    }
  }

  return schedule;
}

class RequestError extends TaggedError<"REQUEST_ERROR"> {
    constructor(
    ) {
        super("REQUEST_ERROR")
    }
}

export class ValidationError extends TaggedError<"VALIDATION_ERROR"> {
    constructor(
        readonly zodError: ZodError
    ) {
        super("VALIDATION_ERROR")
    }
  }

export type FetchScheduleResult = Result<ISchedule, RequestError | ValidationError>;