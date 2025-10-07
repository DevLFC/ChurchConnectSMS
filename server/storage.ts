import {
  type Member,
  type InsertMember,
  type Attendance,
  type InsertAttendance,
  type SMSTemplate,
  type InsertSMSTemplate,
  type SMSProvider,
  type InsertSMSProvider,
  type SMSLog,
  type InsertSMSLog,
  type User,
  type InsertUser,
  type BirthdayMessage,
  type InsertBirthdayMessage,
  type BirthdayLog,
  type InsertBirthdayLog,
  members,
  attendance,
  smsTemplates,
  smsProviders,
  smsLogs,
  users,
  birthdayMessages,
  birthdayLogs,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, ne } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getMembers(): Promise<Member[]>;
  getMember(id: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: string, member: InsertMember): Promise<Member | undefined>;
  deleteMember(id: string): Promise<boolean>;
  importMembers(members: InsertMember[]): Promise<Member[]>;

  getAttendance(): Promise<Attendance[]>;
  getAttendanceByDate(date: string): Promise<Attendance[]>;
  markAttendance(records: InsertAttendance[]): Promise<Attendance[]>;

  getSMSTemplates(): Promise<SMSTemplate[]>;
  getSMSTemplate(id: string): Promise<SMSTemplate | undefined>;
  createSMSTemplate(template: InsertSMSTemplate): Promise<SMSTemplate>;
  updateSMSTemplate(id: string, template: InsertSMSTemplate): Promise<SMSTemplate | undefined>;
  deleteSMSTemplate(id: string): Promise<boolean>;

  getSMSProviders(): Promise<SMSProvider[]>;
  getSMSProvider(id: string): Promise<SMSProvider | undefined>;
  createSMSProvider(provider: InsertSMSProvider): Promise<SMSProvider>;
  updateSMSProvider(id: string, provider: Partial<InsertSMSProvider>): Promise<SMSProvider | undefined>;
  deleteSMSProvider(id: string): Promise<boolean>;
  updateProviderBalance(id: string, balance: string): Promise<void>;

  getSMSLogs(): Promise<SMSLog[]>;
  createSMSLog(log: InsertSMSLog): Promise<SMSLog>;
  updateSMSLogDeliveryStatus(id: string, deliveryStatus: string): Promise<void>;

  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  getBirthdayMessages(): Promise<BirthdayMessage[]>;
  getActiveBirthdayMessage(): Promise<BirthdayMessage | null>;
  createBirthdayMessage(data: InsertBirthdayMessage): Promise<BirthdayMessage>;
  updateBirthdayMessage(id: string, data: Partial<InsertBirthdayMessage>): Promise<BirthdayMessage | null>;
  deleteBirthdayMessage(id: string): Promise<boolean>;

  getBirthdayLogs(): Promise<BirthdayLog[]>;
  getBirthdayLogsByDate(date: string): Promise<BirthdayLog[]>;
  createBirthdayLog(data: InsertBirthdayLog): Promise<BirthdayLog>;
  checkBirthdayLogExists(memberId: string, sentDate: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getMembers(): Promise<Member[]> {
    return await db.select().from(members);
  }

  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const id = randomUUID();
    const [member] = await db
      .insert(members)
      .values({ ...insertMember, id })
      .returning();
    return member;
  }

  async updateMember(id: string, insertMember: InsertMember): Promise<Member | undefined> {
    const [updated] = await db
      .update(members)
      .set(insertMember)
      .where(eq(members.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMember(id: string): Promise<boolean> {
    const result = await db.delete(members).where(eq(members.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async importMembers(membersList: InsertMember[]): Promise<Member[]> {
    const imported: Member[] = [];
    for (const insertMember of membersList) {
      const member = await this.createMember(insertMember);
      imported.push(member);
    }
    return imported;
  }

  async getAttendance(): Promise<Attendance[]> {
    return await db.select().from(attendance);
  }

  async getAttendanceByDate(date: string): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.serviceDate, date));
  }

  async markAttendance(records: InsertAttendance[]): Promise<Attendance[]> {
    const marked: Attendance[] = [];
    
    for (const record of records) {
      const id = randomUUID();
      const [result] = await db
        .insert(attendance)
        .values({ ...record, id })
        .onConflictDoUpdate({
          target: [attendance.memberId, attendance.serviceDate],
          set: { status: record.status, markedAt: new Date() },
        })
        .returning();
      marked.push(result);
    }
    
    return marked;
  }

  async getSMSTemplates(): Promise<SMSTemplate[]> {
    return await db.select().from(smsTemplates);
  }

  async getSMSTemplate(id: string): Promise<SMSTemplate | undefined> {
    const [template] = await db.select().from(smsTemplates).where(eq(smsTemplates.id, id));
    return template || undefined;
  }

  async createSMSTemplate(insertTemplate: InsertSMSTemplate): Promise<SMSTemplate> {
    const id = randomUUID();
    const [template] = await db
      .insert(smsTemplates)
      .values({ ...insertTemplate, id })
      .returning();
    return template;
  }

  async updateSMSTemplate(
    id: string,
    insertTemplate: InsertSMSTemplate
  ): Promise<SMSTemplate | undefined> {
    const [updated] = await db
      .update(smsTemplates)
      .set(insertTemplate)
      .where(eq(smsTemplates.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSMSTemplate(id: string): Promise<boolean> {
    const result = await db.delete(smsTemplates).where(eq(smsTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getSMSProviders(): Promise<SMSProvider[]> {
    return await db.select().from(smsProviders);
  }

  async getSMSProvider(id: string): Promise<SMSProvider | undefined> {
    const [provider] = await db.select().from(smsProviders).where(eq(smsProviders.id, id));
    return provider || undefined;
  }

  async createSMSProvider(insertProvider: InsertSMSProvider): Promise<SMSProvider> {
    const id = randomUUID();
    const [provider] = await db
      .insert(smsProviders)
      .values({ ...insertProvider, id })
      .returning();
    return provider;
  }

  async updateSMSProvider(
    id: string,
    updates: Partial<InsertSMSProvider>
  ): Promise<SMSProvider | undefined> {
    const [updated] = await db
      .update(smsProviders)
      .set(updates)
      .where(eq(smsProviders.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSMSProvider(id: string): Promise<boolean> {
    const result = await db.delete(smsProviders).where(eq(smsProviders.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateProviderBalance(id: string, balance: string): Promise<void> {
    await db
      .update(smsProviders)
      .set({ 
        balance, 
        lastBalanceCheck: new Date() 
      })
      .where(eq(smsProviders.id, id));
  }

  async getSMSLogs(): Promise<SMSLog[]> {
    return await db.select().from(smsLogs).orderBy(desc(smsLogs.sentAt));
  }

  async createSMSLog(insertLog: InsertSMSLog): Promise<SMSLog> {
    const id = randomUUID();
    const [log] = await db
      .insert(smsLogs)
      .values({ ...insertLog, id })
      .returning();
    return log;
  }

  async updateSMSLogDeliveryStatus(id: string, deliveryStatus: string): Promise<void> {
    await db
      .update(smsLogs)
      .set({ 
        deliveryStatus, 
        lastChecked: new Date() 
      })
      .where(eq(smsLogs.id, id));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, id })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getBirthdayMessages(): Promise<BirthdayMessage[]> {
    return await db.select().from(birthdayMessages);
  }

  async getActiveBirthdayMessage(): Promise<BirthdayMessage | null> {
    const [message] = await db
      .select()
      .from(birthdayMessages)
      .where(eq(birthdayMessages.isActive, true))
      .orderBy(desc(birthdayMessages.updatedAt));
    return message || null;
  }

  async createBirthdayMessage(insertMessage: InsertBirthdayMessage): Promise<BirthdayMessage> {
    const id = randomUUID();
    
    try {
      return await db.transaction(async (tx) => {
        if (insertMessage.isActive === true) {
          await tx
            .update(birthdayMessages)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(birthdayMessages.isActive, true));
        }
        
        const [message] = await tx
          .insert(birthdayMessages)
          .values({ ...insertMessage, id })
          .returning();
        return message;
      });
    } catch (error: any) {
      if (error.code === '23505' && error.constraint === 'birthday_messages_active_unique') {
        console.error('Unique constraint violation when creating birthday message:', error);
        throw new Error('Another birthday message is already active. Please deactivate it first.');
      }
      throw error;
    }
  }

  async updateBirthdayMessage(id: string, updates: Partial<InsertBirthdayMessage>): Promise<BirthdayMessage | null> {
    try {
      return await db.transaction(async (tx) => {
        if (updates.isActive === true) {
          await tx
            .update(birthdayMessages)
            .set({ isActive: false, updatedAt: new Date() })
            .where(and(
              eq(birthdayMessages.isActive, true),
              ne(birthdayMessages.id, id)
            ));
        }
        
        const [updated] = await tx
          .update(birthdayMessages)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(birthdayMessages.id, id))
          .returning();
        return updated || null;
      });
    } catch (error: any) {
      if (error.code === '23505' && error.constraint === 'birthday_messages_active_unique') {
        console.error('Unique constraint violation when updating birthday message:', error);
        throw new Error('Another birthday message is already active. Please deactivate it first.');
      }
      throw error;
    }
  }

  async deleteBirthdayMessage(id: string): Promise<boolean> {
    const result = await db.delete(birthdayMessages).where(eq(birthdayMessages.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getBirthdayLogs(): Promise<BirthdayLog[]> {
    return await db.select().from(birthdayLogs).orderBy(desc(birthdayLogs.sentAt));
  }

  async getBirthdayLogsByDate(date: string): Promise<BirthdayLog[]> {
    return await db
      .select()
      .from(birthdayLogs)
      .where(eq(birthdayLogs.sentDate, date));
  }

  async createBirthdayLog(insertLog: InsertBirthdayLog): Promise<BirthdayLog> {
    const id = randomUUID();
    const [log] = await db
      .insert(birthdayLogs)
      .values({ ...insertLog, id })
      .returning();
    return log;
  }

  async checkBirthdayLogExists(memberId: string, sentDate: string): Promise<boolean> {
    const [log] = await db
      .select()
      .from(birthdayLogs)
      .where(and(eq(birthdayLogs.memberId, memberId), eq(birthdayLogs.sentDate, sentDate)));
    return !!log;
  }
}

export const storage = new DatabaseStorage();
