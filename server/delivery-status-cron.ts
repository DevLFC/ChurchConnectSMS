import cron from "node-cron";
import { deliveryStatusService } from "./delivery-status-service";
import { log } from "./vite";

const CRON_SCHEDULE = process.env.DELIVERY_STATUS_CRON_SCHEDULE || '*/30 * * * *';
const CRON_ENABLED = process.env.DELIVERY_STATUS_CRON_ENABLED !== 'false';

export function initializeDeliveryStatusCron() {
  if (!CRON_ENABLED) {
    log("Delivery status cron job is disabled (DELIVERY_STATUS_CRON_ENABLED=false)");
    return undefined;
  }

  if (!cron.validate(CRON_SCHEDULE)) {
    console.error(`Invalid cron schedule: ${CRON_SCHEDULE}. Using default: */30 * * * *`);
    return initializeDeliveryStatusCronWithSchedule('*/30 * * * *');
  }

  return initializeDeliveryStatusCronWithSchedule(CRON_SCHEDULE);
}

function initializeDeliveryStatusCronWithSchedule(schedule: string) {
  const task = cron.schedule(schedule, async () => {
    const timestamp = new Date().toISOString();
    log(`[Delivery Status Cron] Starting delivery status check at ${timestamp}`);
    
    try {
      const results = await deliveryStatusService.checkPendingMessages();
      
      log(`[Delivery Status Cron] Completed - Checked: ${results.checked}, Updated: ${results.updated}, Errors: ${results.errors}`);
    } catch (error) {
      console.error('[Delivery Status Cron] Error during delivery status check:', error);
      
      if (error instanceof Error) {
        log(`[Delivery Status Cron] Error: ${error.message}`);
      }
    }
  });

  task.start();

  log(`Delivery status cron job initialized with schedule: ${schedule} (runs every 30 minutes)`);
  
  return task;
}
