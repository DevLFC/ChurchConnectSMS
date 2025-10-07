import cron from "node-cron";
import { birthdayService } from "./birthday-service";
import { log } from "./vite";

const CRON_SCHEDULE = process.env.BIRTHDAY_CRON_SCHEDULE || '0 8 * * *';
const CRON_ENABLED = process.env.BIRTHDAY_CRON_ENABLED !== 'false';

export function initializeBirthdayCron() {
  if (!CRON_ENABLED) {
    log("Birthday cron job is disabled (BIRTHDAY_CRON_ENABLED=false)");
    return undefined;
  }

  if (!cron.validate(CRON_SCHEDULE)) {
    console.error(`Invalid cron schedule: ${CRON_SCHEDULE}. Using default: 0 8 * * *`);
    return initializeBirthdayCronWithSchedule('0 8 * * *');
  }

  return initializeBirthdayCronWithSchedule(CRON_SCHEDULE);
}

function initializeBirthdayCronWithSchedule(schedule: string) {
  const task = cron.schedule(schedule, async () => {
    const timestamp = new Date().toISOString();
    log(`[Birthday Cron] Starting birthday check at ${timestamp}`);
    
    try {
      const results = await birthdayService.checkAndSendBirthdayMessages();
      
      log(`[Birthday Cron] Completed - Sent: ${results.sent}, Skipped: ${results.skipped}, Failed: ${results.failed}`);
      
      if (results.details.sent.length > 0) {
        log(`[Birthday Cron] Successfully sent to: ${results.details.sent.join(', ')}`);
      }
      
      if (results.details.skipped.length > 0) {
        log(`[Birthday Cron] Skipped (already sent): ${results.details.skipped.join(', ')}`);
      }
      
      if (results.details.failed.length > 0) {
        console.error(`[Birthday Cron] Failed to send to:`, results.details.failed);
      }
      
      if (results.message) {
        log(`[Birthday Cron] ${results.message}`);
      }
    } catch (error) {
      console.error('[Birthday Cron] Error during birthday check:', error);
      
      if (error instanceof Error) {
        log(`[Birthday Cron] Error: ${error.message}`);
      }
    }
  });

  task.start();

  log(`Birthday cron job initialized with schedule: ${schedule} (runs daily at 8:00 AM)`);
  
  return task;
}
