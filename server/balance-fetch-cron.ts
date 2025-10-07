import cron from "node-cron";
import { balanceFetchService } from "./balance-fetch-service";
import { log } from "./vite";

const CRON_SCHEDULE = process.env.BALANCE_FETCH_CRON_SCHEDULE || '0 */6 * * *';
const CRON_ENABLED = process.env.BALANCE_FETCH_CRON_ENABLED !== 'false';

export function initializeBalanceFetchCron() {
  if (!CRON_ENABLED) {
    log("Balance fetch cron job is disabled (BALANCE_FETCH_CRON_ENABLED=false)");
    return undefined;
  }

  if (!cron.validate(CRON_SCHEDULE)) {
    console.error(`Invalid cron schedule: ${CRON_SCHEDULE}. Using default: 0 */6 * * *`);
    return initializeBalanceFetchCronWithSchedule('0 */6 * * *');
  }

  return initializeBalanceFetchCronWithSchedule(CRON_SCHEDULE);
}

function initializeBalanceFetchCronWithSchedule(schedule: string) {
  const task = cron.schedule(schedule, async () => {
    const timestamp = new Date().toISOString();
    log(`[Balance Fetch Cron] Starting balance fetch at ${timestamp}`);
    
    try {
      const results = await balanceFetchService.fetchAllProviderBalances();
      
      log(`[Balance Fetch Cron] Completed - Total: ${results.total}, Successful: ${results.successful}, Failed: ${results.failed}`);
      
      for (const result of results.results) {
        if (result.success) {
          log(`[Balance Fetch Cron] ${result.providerName}: Balance = ${result.balance}`);
        } else {
          log(`[Balance Fetch Cron] ${result.providerName}: Failed - ${result.error}`);
        }
      }
    } catch (error) {
      console.error('[Balance Fetch Cron] Error during balance fetch:', error);
      
      if (error instanceof Error) {
        log(`[Balance Fetch Cron] Error: ${error.message}`);
      }
    }
  });

  task.start();

  log(`Balance fetch cron job initialized with schedule: ${schedule} (runs every 6 hours)`);
  
  return task;
}
