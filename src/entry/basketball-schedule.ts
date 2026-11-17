import { createWidget } from "basketball-schedule/create-widget";
import { fetchSchedule, fetchTeamSchedule } from "basketball-schedule/fetch-schedule";

const TEAMS = [
  { name: 'Lakers', slug: 'lal', abbr: 'LAL', color: '#FDB927' },
  { name: '76ers', slug: 'phi', abbr: 'PHI', color: '#3D8BFD' },
];

async function run() {
  const today = new Date();
  
  const [fetchScheduleResult, ...teamResults] = await Promise.all([
    fetchSchedule(today),
    ...TEAMS.map(team => fetchTeamSchedule(team.slug, today)),
  ]);
  
  const widget = createWidget(
    fetchScheduleResult!,
    TEAMS.map((team, i) => ({ ...team, result: teamResults[i]! })),
  );

  Script.setWidget(widget);
  
  Script.complete();
  
  console.log('--- Widget Created ---');
}

run();