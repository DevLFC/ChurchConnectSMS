import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMemberSchema, insertAttendanceSchema, insertSMSTemplateSchema, insertSMSProviderSchema, insertSMSLogSchema, insertBirthdayMessageSchema, type Member, registerSchema, loginSchema } from "@shared/schema";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { smsService } from "./sms";
import { authService } from "./auth";
import { requireAuth, requireRole } from "./middleware";
import { z } from "zod";
import { birthdayService } from "./birthday-service";
import { balanceFetchService } from "./balance-fetch-service";
import { fetchMembersFromSheet } from "./google-sheets-service";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      const user = await authService.register(data);
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.username = user.username;
      req.session.userDepartment = user.department ?? undefined;
      
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to save session" });
        }
        res.json(user);
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(400).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await authService.login(username, password);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.username = user.username;
      req.session.userDepartment = user.department ?? undefined;
      
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to save session" });
        }
        res.json(user);
      });
    } catch (error) {
      res.status(400).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    res.json({
      id: req.session.userId,
      username: req.session.username,
      role: req.session.userRole,
      department: req.session.userDepartment,
    });
  });
  app.get("/api/members", requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.session.userRole === "Department Leader" && !req.session.userDepartment) {
        return res.status(403).json({ error: "Department Leaders must have a department assigned" });
      }
      
      let members = await storage.getMembers();
      
      if (req.session.userRole === "Department Leader" && req.session.userDepartment) {
        members = members.filter(m => m.department === req.session.userDepartment);
      }
      
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  app.post("/api/members", requireAuth, requireRole("Admin", "Secretary", "Pastor"), async (req: Request, res: Response) => {
    try {
      const data = insertMemberSchema.parse(req.body);
      const member = await storage.createMember(data);
      res.json(member);
    } catch (error) {
      res.status(400).json({ error: "Invalid member data" });
    }
  });

  app.put("/api/members/:id", requireAuth, requireRole("Admin", "Secretary", "Pastor"), async (req: Request, res: Response) => {
    try {
      const data = insertMemberSchema.parse(req.body);
      const member = await storage.updateMember(req.params.id, data);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(400).json({ error: "Invalid member data" });
    }
  });

  app.delete("/api/members/:id", requireAuth, requireRole("Admin", "Secretary", "Pastor"), async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteMember(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete member" });
    }
  });

  app.post("/api/members/import", requireAuth, requireRole("Admin", "Secretary", "Pastor"), upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString("utf-8");
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (records.length === 0) {
        return res.status(400).json({ error: "CSV file is empty or contains no valid data rows" });
      }

      const errors: string[] = [];
      const members = records.reduce((acc: any[], record: any, index: number) => {
        try {
          const member = insertMemberSchema.parse({
            name: record.name || record.Name,
            phone: record.phone || record.Phone,
            gender: record.gender || record.Gender,
            department: record.department || record.Department,
            status: record.status || record.Status || "Active",
          });
          acc.push(member);
        } catch (error) {
          errors.push(`Row ${index + 2}: Invalid data format`);
        }
        return acc;
      }, []);

      if (members.length === 0) {
        return res.status(400).json({ 
          error: "No valid members found in CSV",
          details: errors.slice(0, 5)
        });
      }

      const imported = await storage.importMembers(members);
      res.json({ success: true, count: imported.length, members: imported });
    } catch (error) {
      console.error("CSV import error:", error);
      res.status(400).json({ error: "Failed to import CSV" });
    }
  });

  app.get("/api/attendance", async (req: Request, res: Response) => {
    try {
      if (req.session.userRole === "Department Leader" && !req.session.userDepartment) {
        return res.status(403).json({ error: "Department Leaders must have a department assigned" });
      }
      
      const date = req.query.date as string | undefined;
      let attendance = date
        ? await storage.getAttendanceByDate(date)
        : await storage.getAttendance();
      
      if (req.session.userRole === "Department Leader" && req.session.userDepartment) {
        const members = await storage.getMembers();
        const departmentMemberIds = members
          .filter(m => m.department === req.session.userDepartment)
          .map(m => m.id);
        attendance = attendance.filter(a => departmentMemberIds.includes(a.memberId));
      }
      
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance/bulk", async (req: Request, res: Response) => {
    try {
      const { records } = req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({ error: "Records must be an array" });
      }

      const validatedRecords = records.map((record) =>
        insertAttendanceSchema.parse(record)
      );

      const marked = await storage.markAttendance(validatedRecords);
      res.json({ success: true, count: marked.length, records: marked });
    } catch (error) {
      res.status(400).json({ error: "Invalid attendance data" });
    }
  });

  app.get("/api/sms-templates", async (req: Request, res: Response) => {
    try {
      const templates = await storage.getSMSTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/sms-templates", async (req: Request, res: Response) => {
    try {
      const data = insertSMSTemplateSchema.parse(req.body);
      const template = await storage.createSMSTemplate(data);
      res.json(template);
    } catch (error) {
      res.status(400).json({ error: "Invalid template data" });
    }
  });

  app.put("/api/sms-templates/:id", async (req: Request, res: Response) => {
    try {
      const data = insertSMSTemplateSchema.parse(req.body);
      const template = await storage.updateSMSTemplate(req.params.id, data);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(400).json({ error: "Invalid template data" });
    }
  });

  app.delete("/api/sms-templates/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteSMSTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  app.get("/api/sms-providers", async (req: Request, res: Response) => {
    try {
      const providers = await storage.getSMSProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch providers" });
    }
  });

  app.post("/api/sms-providers", async (req: Request, res: Response) => {
    try {
      const data = insertSMSProviderSchema.parse(req.body);
      const provider = await storage.createSMSProvider(data);
      res.json(provider);
    } catch (error) {
      res.status(400).json({ error: "Invalid provider data" });
    }
  });

  app.patch("/api/sms-providers/:id/toggle", async (req: Request, res: Response) => {
    try {
      const { isActive } = req.body;
      const provider = await storage.updateSMSProvider(req.params.id, { isActive });
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      res.status(400).json({ error: "Failed to update provider" });
    }
  });

  app.delete("/api/sms-providers/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteSMSProvider(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete provider" });
    }
  });

  app.post("/api/sms-providers/:id/refresh-balance", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = await balanceFetchService.fetchProviderBalance(req.params.id);
      if (!result.success) {
        return res.status(400).json({ error: result.error || "Failed to fetch balance" });
      }
      
      const provider = await storage.getSMSProvider(req.params.id);
      res.json(provider);
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh balance" });
    }
  });

  app.get("/api/sms-logs", async (req: Request, res: Response) => {
    try {
      const logs = await storage.getSMSLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch SMS logs" });
    }
  });

  app.post("/api/sms-logs", async (req: Request, res: Response) => {
    try {
      const data = insertSMSLogSchema.parse(req.body);
      const log = await storage.createSMSLog(data);
      res.json(log);
    } catch (error) {
      res.status(400).json({ error: "Invalid log data" });
    }
  });

  app.post("/api/send-sms", async (req: Request, res: Response) => {
    try {
      if (req.session.userRole === "Department Leader") {
        console.log(`[SMS] Department Leader ${req.session.username} attempted to send SMS - Permission denied`);
        return res.status(403).json({ error: "Department Leaders do not have permission to send SMS" });
      }

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
      
      if (hour < 8 || hour >= 20) {
        const timeStr = `${hour}:${String(minutes).padStart(2, '0')}`;
        return res.status(400).json({ 
          error: `SMS sending is only allowed between 8:00 AM and 8:00 PM (Nigeria time). Current time: ${timeStr}` 
        });
      }

      const { recipients, message, providerId, templateId } = req.body;

      if (!Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: "Recipients must be a non-empty array" });
      }

      const provider = await storage.getSMSProvider(providerId);
      if (!provider || !provider.isActive) {
        return res.status(400).json({ error: "Invalid or inactive provider" });
      }

      const messageContent = message || "";

      const results = [];
      for (const recipientId of recipients) {
        const member = await storage.getMember(recipientId);
        if (!member) {
          results.push({
            success: false,
            recipient: recipientId,
            error: "Member not found",
          });
          continue;
        }

        const smsResult = await smsService.sendSMS(provider, member, messageContent);

        const log = await storage.createSMSLog({
          recipientName: member.name,
          recipientPhone: member.phone,
          message: smsResult.processedMessage,
          providerId: providerId,
          status: smsResult.success ? "Sent" : "Failed",
          deliveryStatus: smsResult.success 
            ? "Pending"
            : `Failed - ${smsResult.error}`,
          messageId: smsResult.externalId || null,
        });

        results.push({
          success: smsResult.success,
          recipient: member.name,
          logId: log.id,
          error: smsResult.error,
        });
      }

      res.json({ success: true, results });
    } catch (error) {
      console.error("SMS send error:", error);
      res.status(500).json({ error: "Failed to send SMS" });
    }
  });

  app.get("/api/birthday-messages", async (req: Request, res: Response) => {
    try {
      const messages = await storage.getBirthdayMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch birthday messages" });
    }
  });

  app.get("/api/birthday-messages/active", async (req: Request, res: Response) => {
    try {
      const message = await storage.getActiveBirthdayMessage();
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active birthday message" });
    }
  });

  app.post("/api/birthday-messages", async (req: Request, res: Response) => {
    try {
      if (req.session.userRole !== 'Admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const data = insertBirthdayMessageSchema.parse(req.body);
      const message = await storage.createBirthdayMessage(data);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      if (error instanceof Error && error.message?.includes("already active")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Unexpected error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/birthday-messages/:id", async (req: Request, res: Response) => {
    try {
      if (req.session.userRole !== 'Admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const updateBirthdayMessageSchema = insertBirthdayMessageSchema.partial();
      const data = updateBirthdayMessageSchema.parse(req.body);
      const message = await storage.updateBirthdayMessage(req.params.id, data);
      if (!message) {
        return res.status(404).json({ error: "Birthday message not found" });
      }
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      if (error instanceof Error && error.message?.includes("already active")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Unexpected error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/birthday-messages/:id", async (req: Request, res: Response) => {
    try {
      if (req.session.userRole !== 'Admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const deleted = await storage.deleteBirthdayMessage(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Birthday message not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete birthday message" });
    }
  });

  app.get("/api/birthday-logs", async (req: Request, res: Response) => {
    try {
      if (req.session.userRole !== 'Admin' && req.session.userRole !== 'Pastor') {
        return res.status(403).json({ error: "Admin or Pastor access required" });
      }

      const logs = await storage.getBirthdayLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch birthday logs" });
    }
  });

  app.post("/api/birthday-check", async (req: Request, res: Response) => {
    try {
      if (req.session.userRole !== 'Admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const results = await birthdayService.checkAndSendBirthdayMessages();
      res.json(results);
    } catch (error) {
      console.error("Birthday check error:", error);
      
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: "Failed to trigger birthday check" });
    }
  });

  app.post("/api/members/sync-google-sheet", requireAuth, requireRole("Admin", "Secretary", "Pastor"), async (req: Request, res: Response) => {
    try {
      const { spreadsheetId, range } = req.body;
      
      if (!spreadsheetId) {
        return res.status(400).json({ error: "Spreadsheet ID is required" });
      }

      const sheetMembers = await fetchMembersFromSheet(spreadsheetId, range);
      
      if (sheetMembers.length === 0) {
        return res.status(400).json({ error: "No members found in the Google Sheet" });
      }

      const errors: string[] = [];
      const validMembers = sheetMembers.reduce((acc: any[], member: any, index: number) => {
        try {
          const validatedMember = insertMemberSchema.parse(member);
          acc.push(validatedMember);
        } catch (error) {
          errors.push(`Row ${index + 2}: Invalid data format`);
        }
        return acc;
      }, []);

      if (validMembers.length === 0) {
        return res.status(400).json({ 
          error: "No valid members found in Google Sheet",
          details: errors.slice(0, 5)
        });
      }

      const imported = await storage.importMembers(validMembers);
      res.json({ 
        success: true, 
        count: imported.length, 
        members: imported,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined 
      });
    } catch (error: any) {
      console.error("Google Sheets sync error:", error);
      res.status(400).json({ error: error.message || "Failed to sync with Google Sheets" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
