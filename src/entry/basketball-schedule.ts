import { createWidget } from "basketball-schedule/create-widget";
import { fetchSchedule } from "basketball-schedule/fetch-schedule";

async function run() {
  const today = new Date();
  // Fetch schedules
  const schedule = await fetchSchedule(today);
  
  if (!schedule) {
    console.error('No schedule data available');
    return;
  }

  const widget = createWidget(
    schedule
  );

  Script.setWidget(widget);
  
  Script.complete();
  
  console.log('--- Widget Created ---');
}

run();