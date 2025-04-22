import { z } from 'zod';

export const gameSchema = z.object({
  date: z.string().datetime(),
  name: z.string(),
  shortName: z.string(),
});
export type IGame = z.infer<typeof gameSchema>;

export const dayScheduleSchema = z.object({
  games: z.array(gameSchema),
});
export type IDaySchedule = z.infer<typeof dayScheduleSchema>;

// Root Schema
export const scheduleResponseSchema = z.object({
  content: z.object({
    schedule: z.record(z.string(), dayScheduleSchema),
  }),
});
export type IScheduleResponse = z.infer<typeof scheduleResponseSchema>; 

export type ISchedule = {
  [key: string]: IGame[]
}