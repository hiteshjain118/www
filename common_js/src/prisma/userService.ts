import PrismaService from './client';

export interface User {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
}

export class UserService {
  private static instance: UserService;

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(data: {
    id: string;
    email: string;
    role?: string;
  }): Promise<User> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.user.create({
        data: {
          id: data.id,
          email: data.email,
          role: data.role || 'authenticated',
        },
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update a user
   */
  async updateUser(
    id: string,
    data: Partial<{
      email: string;
      role: string;
    }>
  ): Promise<User> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<void> {
    const prisma = PrismaService.getInstance();
    
    try {
      await prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }
} 