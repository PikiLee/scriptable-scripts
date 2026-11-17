import { createWidget } from "basketball-schedule/create-widget";
import { fetchSchedule, fetchTeamSchedule } from "basketball-schedule/fetch-schedule";
import { loadLogos } from "basketball-schedule/logos";

const TEAMS = [
  { name: 'Lakers', slug: 'lal', abbr: 'LAL', color: '#FDB927' },
  { name: '76ers', slug: 'phi', abbr: 'PHI', color: '#3D8BFD' },
];

async function run() {
  const today = new Date();
  
  const [fetchScheduleResult, teamResults] = await Promise.all([
    fetchSchedule(today),
    Promise.all(TEAMS.map(team => fetchTeamSchedule(team.slug, today))),
  ]);

  const schedules = [fetchScheduleResult, ...teamResults].flatMap(result => result.isOk() ? [result.value] : []);
  const logos = await loadLogos(schedules);
  
  const widget = createWidget(
    fetchScheduleResult,
    TEAMS.map((team, i) => ({ ...team, result: teamResults[i]! })),
    logos,
  );

  Script.setWidget(widget);
  
  Script.complete();
  
  console.log('--- Widget Created ---');
}

run();