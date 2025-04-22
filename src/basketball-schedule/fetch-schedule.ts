import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
dayjs.extend(isSameOrAfter)

import { IGame, IScheduleResponse } from "./types";

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
    console.log(`${year}-${month}-${day}`);
    const url = `${BASE_URL}/nba/schedule?dates=${year}${month}${day}&xhr=1&render=false&device=desktop&userab=18`;
    return url;
  }

// Function to fetch schedule data
export async function fetchSchedule(date: Date): Promise<{
  [key: string]: IGame[]
} | null> {
    const url = constructURL(date);
    const req = new Request(url);
    try {
      const json = await req.loadJSON() as IScheduleResponse;
      const games = Object.values(json.content.schedule).flatMap((daySchedule) => daySchedule.games)

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
      
      return schedule;
    } catch (error) {
      return null;
    }
  }