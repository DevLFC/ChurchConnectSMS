import bcrypt from "bcrypt";
import type { User, InsertUser } from "@shared/schema";
import { storage } from "./storage";

export class AuthService {
  private readonly saltRounds = 10;

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  async register(userData: InsertUser): Promise<Omit<User, "password">> {
    const existingUsername = await storage.getUserByUsername(userData.username);
    if (existingUsername) {
      throw new Error("Username already exists");
    }

    const existingEmail = await storage.getUserByEmail(userData.email);
    if (existingEmail) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await this.hashPassword(userData.password);
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(username: string, password: string): Promise<Omit<User, "password"> | null> {
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return null;
    }

    const isValidPassword = await this.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  sanitizeUser(user: User): Omit<User, "password"> {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();
