import { pgTable, text, varchar, timestamp, boolean, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const members = pgTable("members", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  gender: text("gender").notNull(),
  department: text("department").notNull(),
  birthday: text("birthday"),
  status: text("status").notNull().default("Active"),
});

export const insertMemberSchema = createInsertSchema(members).omit({ id: true });
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey(),
  memberId: varchar("member_id").notNull(),
  serviceDate: text("service_date").notNull(),
  status: text("status").notNull(),
  markedAt: timestamp("marked_at").notNull().defaultNow(),
}, (table) => ({
  memberDateIdx: uniqueIndex("attendance_member_date_idx").on(table.memberId, table.serviceDate),
}));

export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, markedAt: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export const smsTemplates = pgTable("sms_templates", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSMSTemplateSchema = createInsertSchema(smsTemplates).omit({ id: true, createdAt: true });
export type InsertSMSTemplate = z.infer<typeof insertSMSTemplateSchema>;
export type SMSTemplate = typeof smsTemplates.$inferSelect;

export const smsProviders = pgTable("sms_providers", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  apiEndpoint: text("api_endpoint").notNull(),
  authMethod: text("auth_method").notNull(),
  apiKey: text("api_key"),
  username: text("username"),
  password: text("password"),
  requestMethod: text("request_method").notNull(),
  sender: text("sender"),
  isActive: boolean("is_active").notNull().default(false),
  balance: text("balance"),
  lastBalanceCheck: timestamp("last_balance_check"),
});

export const insertSMSProviderSchema = createInsertSchema(smsProviders).omit({ id: true });
export type InsertSMSProvider = z.infer<typeof insertSMSProviderSchema>;
export type SMSProvider = typeof smsProviders.$inferSelect;

export const smsLogs = pgTable("sms_logs", {
  id: varchar("id").primaryKey(),
  recipientName: text("recipient_name").notNull(),
  recipientPhone: text("recipient_phone").notNull(),
  message: text("message").notNull(),
  providerId: varchar("provider_id").notNull(),
  status: text("status").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  deliveryStatus: text("delivery_status"),
  messageId: text("message_id"),
  lastChecked: timestamp("last_checked"),
});

export const insertSMSLogSchema = createInsertSchema(smsLogs).omit({ id: true, sentAt: true, lastChecked: true });
export type InsertSMSLog = z.infer<typeof insertSMSLogSchema>;
export type SMSLog = typeof smsLogs.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("Secretary"),
  department: text("department"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
}).refine(
  (data) => {
    if (data.role === "Department Leader" && (!data.department || data.department.trim() === "")) {
      return false;
    }
    return true;
  },
  {
    message: "Department is required for Department Leader role",
    path: ["department"],
  }
);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserRole = "Admin" | "Pastor" | "Secretary" | "Department Leader";

export const birthdayMessages = pgTable("birthday_messages", {
  id: varchar("id").primaryKey(),
  message: text("message").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  activeUniqueIdx: uniqueIndex("birthday_messages_active_unique").on(table.isActive).where(eq(table.isActive, true)),
}));

export const insertBirthdayMessageSchema = createInsertSchema(birthdayMessages).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBirthdayMessage = z.infer<typeof insertBirthdayMessageSchema>;
export type BirthdayMessage = typeof birthdayMessages.$inferSelect;

export const birthdayLogs = pgTable("birthday_logs", {
  id: varchar("id").primaryKey(),
  memberId: varchar("member_id").notNull(),
  memberName: text("member_name").notNull(),
  memberPhone: text("member_phone").notNull(),
  message: text("message").notNull(),
  sentDate: text("sent_date").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  status: text("status").notNull(),
  providerId: varchar("provider_id").notNull(),
}, (table) => ({
  memberSentDateIdx: uniqueIndex("birthday_logs_member_sent_date_idx").on(table.memberId, table.sentDate),
}));

export const insertBirthdayLogSchema = createInsertSchema(birthdayLogs).omit({ id: true, sentAt: true });
export type InsertBirthdayLog = z.infer<typeof insertBirthdayLogSchema>;
export type BirthdayLog = typeof birthdayLogs.$inferSelect;
