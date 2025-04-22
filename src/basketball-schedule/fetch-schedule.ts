import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
dayjs.extend(isSameOrAfter)

import { IGame, ISchedule, scheduleResponseSchema } from "./types";
import { err, ok, Result } from "neverthrow";
import { ZodError } from "zod";
import { TaggedError } from "@nakanoaas/tagged-error";

const BASE_URL = 'http://cdn.espn.com/core';

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
    const url = `${BASE_URL}/nba/schedule?dates=${year}${month}${day}&xhr=1&render=false&device=desktop&userab=18`;
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

      const games = Object.values(data.data.content.schedule).flatMap((daySchedule) => daySchedule.games)

      const schedule: {
        [key: string]: IGame[]
      } = {}
      
      for (const game of games) {
        const gameDate = dayjs(game.date);
        if (gameDate.isBefore(date)) continue;

        const gameDay = gameDate.format('YYYY-MM-DD');
        if (!schedule[gameDay]) {
          schedule[gameDay] = [game]
        } else {
          schedule[gameDay].push(game)
        }
      }

      return ok(schedule);
    } catch (error) {
        return err(new RequestError());
    }
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