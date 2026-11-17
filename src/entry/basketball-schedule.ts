import { createWidget } from "basketball-schedule/create-widget";
import { fetchSchedule, fetchTeamSchedule } from "basketball-schedule/fetch-schedule";

const TEAMS = [
  { name: 'Lakers', slug: 'lal' },
  { name: '76ers', slug: 'phi' },
];

async function run() {
  const today = new Date();
  
  const [fetchScheduleResult, ...teamResults] = await Promise.all([
    fetchSchedule(today),
    ...TEAMS.map(team => fetchTeamSchedule(team.slug, today)),
  ]);
  
  const widget = createWidget(
    fetchScheduleResult!,
    TEAMS.map((team, i) => ({ name: team.name, result: teamResults[i]! })),
  );

  Script.setWidget(widget);
  
  Script.complete();
  
  console.log('--- Widget Created ---');
}

run();