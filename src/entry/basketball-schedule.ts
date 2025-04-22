import { createWidget } from "basketball-schedule/create-widget";
import { fetchSchedule } from "basketball-schedule/fetch-schedule";

async function run() {
  const today = new Date();
  
  const fetchScheduleResult = await fetchSchedule(today);
  
  const widget = createWidget(
    fetchScheduleResult
  );

  Script.setWidget(widget);
  
  Script.complete();
  
  console.log('--- Widget Created ---');
}

run();