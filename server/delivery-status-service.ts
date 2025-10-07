import { storage } from "./storage";

export class DeliveryStatusService {
  async checkDeliveryStatus(messageId: string, provider: any): Promise<{
    status: string;
    details: string;
  }> {
    if (!provider || !messageId) {
      return {
        status: "Unknown",
        details: "Missing provider or message ID",
      };
    }

    if (!provider.username || !provider.password) {
      return {
        status: "Unknown",
        details: "Provider credentials not configured",
      };
    }

    try {
      const url = `https://portal.nigeriabulksms.com/api/report/?username=${encodeURIComponent(provider.username)}&password=${encodeURIComponent(provider.password)}&message_id=${encodeURIComponent(messageId)}`;

      const response = await fetch(url);
      const data = await response.text();

      console.log(`[Delivery Status] Checking message ${messageId}: ${data}`);

      const dataLower = data.toLowerCase().trim();
      
      const deliveredPatterns = /\b(delivered|success|successful)\b/i;
      const failedPatterns = /\b(failed|failure|error|rejected|invalid|undelivered)\b/i;
      const pendingPatterns = /\b(pending|sent|queued|processing|submitted)\b/i;
      
      if (deliveredPatterns.test(dataLower)) {
        return {
          status: "Delivered",
          details: `Delivered - ${data}`,
        };
      } else if (failedPatterns.test(dataLower)) {
        return {
          status: "Failed",
          details: `Failed - ${data}`,
        };
      } else if (pendingPatterns.test(dataLower)) {
        return {
          status: "Pending",
          details: `Pending - ${data}`,
        };
      } else {
        return {
          status: "Unknown",
          details: data,
        };
      }
    } catch (error) {
      console.error(`[Delivery Status] Error checking status for ${messageId}:`, error);
      return {
        status: "Unknown",
        details: error instanceof Error ? error.message : "Failed to check status",
      };
    }
  }

  async checkPendingMessages(): Promise<{
    checked: number;
    updated: number;
    errors: number;
  }> {
    const logs = await storage.getSMSLogs();
    
    const pendingLogs = logs.filter(
      (log) => 
        log.messageId && 
        (log.deliveryStatus === "Pending" || log.deliveryStatus?.includes("Pending"))
    );

    let checked = 0;
    let updated = 0;
    let errors = 0;

    for (const log of pendingLogs) {
      try {
        const provider = await storage.getSMSProvider(log.providerId);
        if (!provider) {
          await storage.updateSMSLogDeliveryStatus(log.id, "Error - Provider not found");
          errors++;
          continue;
        }

        const result = await this.checkDeliveryStatus(log.messageId!, provider);
        
        await storage.updateSMSLogDeliveryStatus(log.id, result.details);
        
        checked++;
        if (result.status !== "Pending") {
          updated++;
        }
      } catch (error) {
        console.error(`[Delivery Status] Error processing log ${log.id}:`, error);
        await storage.updateSMSLogDeliveryStatus(
          log.id, 
          `Error - ${error instanceof Error ? error.message : "Unknown error"}`
        );
        errors++;
      }
    }

    return {
      checked,
      updated,
      errors,
    };
  }
}

export const deliveryStatusService = new DeliveryStatusService();
