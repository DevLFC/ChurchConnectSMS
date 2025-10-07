import { storage } from "./storage";
import { smsService } from "./sms";

export interface BirthdayCheckResult {
  sent: number;
  skipped: number;
  failed: number;
  details: {
    sent: string[];
    skipped: string[];
    failed: { name: string; error: string }[];
  };
  message?: string;
}

export class BirthdayService {
  private getNigeriaTime(): { hour: number; minutes: number } {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Lagos',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    
    return { hour, minutes };
  }

  private isWithinAllowedSendingHours(): { allowed: boolean; message?: string } {
    const { hour, minutes } = this.getNigeriaTime();
    
    if (hour < 8) {
      return {
        allowed: false,
        message: `SMS sending is not allowed before 8:00 AM (current time: ${hour}:${String(minutes).padStart(2, '0')}). Messages will be sent automatically at 8:00 AM.`
      };
    }
    
    if (hour >= 20) {
      return {
        allowed: false,
        message: `SMS sending is not allowed after 8:00 PM (current time: ${hour}:${String(minutes).padStart(2, '0')}). Messages will be sent automatically at 8:00 AM tomorrow.`
      };
    }
    
    return { allowed: true };
  }

  async checkAndSendBirthdayMessages(): Promise<BirthdayCheckResult> {
    const timeCheck = this.isWithinAllowedSendingHours();
    if (!timeCheck.allowed) {
      throw new Error(timeCheck.message || "SMS sending is not allowed at this time");
    }
    const today = new Date();
    const todayMMDD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayFullDate = today.toISOString().split('T')[0];

    const allMembers = await storage.getMembers();
    const birthdayMembers = allMembers.filter(member => {
      if (member.status !== "Active" || !member.birthday) {
        return false;
      }
      const birthdayParts = member.birthday.split('-');
      const memberMMDD = birthdayParts.length === 3 
        ? `${birthdayParts[1]}-${birthdayParts[2]}`
        : member.birthday;
      return memberMMDD === todayMMDD;
    });

    if (birthdayMembers.length === 0) {
      return { 
        sent: 0, 
        skipped: 0, 
        failed: 0, 
        details: { 
          sent: [], 
          skipped: [], 
          failed: [] 
        },
        message: "No birthdays today"
      };
    }

    const activeMessage = await storage.getActiveBirthdayMessage();
    if (!activeMessage) {
      throw new Error("No active birthday message template found. Please activate a birthday message in settings.");
    }

    const providers = await storage.getSMSProviders();
    const activeProvider = providers.find(p => p.isActive);
    if (!activeProvider) {
      throw new Error("No active SMS provider found. Please activate an SMS provider in settings.");
    }

    const results: BirthdayCheckResult = {
      sent: 0,
      skipped: 0,
      failed: 0,
      details: {
        sent: [],
        skipped: [],
        failed: []
      }
    };

    for (const member of birthdayMembers) {
      try {
        const alreadySent = await storage.checkBirthdayLogExists(member.id, todayFullDate);
        if (alreadySent) {
          results.skipped++;
          results.details.skipped.push(member.name);
          continue;
        }

        const firstName = member.name.trim().split(/\s+/)[0] || member.name;
        const personalizedMessage = activeMessage.message.replace(/\{\{name\}\}/g, firstName);

        const smsResult = await smsService.sendSMS(activeProvider, member, personalizedMessage);

        await storage.createBirthdayLog({
          memberId: member.id,
          memberName: member.name,
          memberPhone: member.phone,
          message: smsResult.processedMessage,
          sentDate: todayFullDate,
          status: smsResult.success ? "Sent" : "Failed",
          providerId: activeProvider.id
        });

        if (smsResult.success) {
          results.sent++;
          results.details.sent.push(member.name);
        } else {
          results.failed++;
          results.details.failed.push({
            name: member.name,
            error: smsResult.error || "Unknown error"
          });
          console.error(`Failed to send birthday SMS to ${member.name}:`, smsResult.error);
        }
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.details.failed.push({
          name: member.name,
          error: errorMessage
        });
        console.error(`Error processing birthday for ${member.name}:`, error);
      }
    }

    return results;
  }
}

export const birthdayService = new BirthdayService();
