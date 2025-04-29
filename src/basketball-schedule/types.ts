import { z } from 'zod';

export const competitorSchema = z.object({
  id: z.string(),
  homeAway: z.union([z.literal('home'), z.literal('away')]),
  score: z.string(),
  team: z.object({
    abbreviation: z.string(),
  }),
});
export type ICompetitor = z.infer<typeof competitorSchema>;

export const gameSchema = z.object({
  date: z.string(),
  name: z.string(),
  shortName: z.string(),
  competitions: z.array(z.object({
    competitors: z.array(competitorSchema),
    series: z.object({
      competitors: z.array(z.object({
        id: z.string(),
        wins: z.number(),
      })),
    })
  })),
  status: z.object({
    type: z.object({
      shortDetail: z.string(),
      completed: z.boolean(),
    })
  }),
});
export type IGame = z.infer<typeof gameSchema>;

export const dayScheduleSchema = z.object({
  games: z.array(gameSchema),
});
export type IDaySchedule = z.infer<typeof dayScheduleSchema>;

// Root Schema
export const scheduleResponseSchema = z.object({
  content: z.object({
    schedule: z.record(z.string(), z.union([dayScheduleSchema, z.object({})])),
  }),
});
export type IScheduleResponse = z.infer<typeof scheduleResponseSchema>; 

export type ISchedule = {
  [key: string]: IGame[]
}