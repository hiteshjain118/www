import PrismaService from './client';

export interface Message {
  cbId: bigint;
  threadId: bigint;
  createdAt: Date;
  senderId: bigint;
  receiverId: bigint;
  body: string;
}

export interface MessageWithRelations extends Message {
  thread: {
    cbId: bigint;
    ownerId: bigint;
  };
  tableAttachments: Array<{
    cbId: bigint;
    columns: any;
    rows: any;
    createdAt: Date;
  }>;
}

export class MessageService {
  private static instance: MessageService;

  static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  /**
   * Get message by CB ID
   */
  async getMessage(cbId: bigint): Promise<MessageWithRelations | null> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.message.findUnique({
        where: { cbId },
        include: {
          thread: {
            select: {
              cbId: true,
              ownerId: true,
            },
          },
          tableAttachments: {
            select: {
              cbId: true,
              columns: true,
              rows: true,
              createdAt: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error getting message:', error);
      throw error;
    }
  }

  /**
   * Get messages by thread ID
   */
  async getMessagesByThreadId(threadId: bigint): Promise<MessageWithRelations[]> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.message.findMany({
        where: { threadId },
        include: {
          thread: {
            select: {
              cbId: true,
              ownerId: true,
            },
          },
          tableAttachments: {
            select: {
              cbId: true,
              columns: true,
              rows: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      console.error('Error getting messages by thread ID:', error);
      throw error;
    }
  }

  /**
   * Get messages by sender ID
   */
  async getMessagesBySenderId(senderId: bigint): Promise<Message[]> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.message.findMany({
        where: { senderId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting messages by sender ID:', error);
      throw error;
    }
  }

  /**
   * Get messages by receiver ID
   */
  async getMessagesByReceiverId(receiverId: bigint): Promise<Message[]> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.message.findMany({
        where: { receiverId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting messages by receiver ID:', error);
      throw error;
    }
  }

  /**
   * Create a new message
   */
  async createMessage(data: {
    threadId: bigint;
    senderId: bigint;
    receiverId: bigint;
    body: string;
  }): Promise<Message> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.message.create({
        data: {
          threadId: data.threadId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          body: data.body,
        },
      });
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  /**
   * Update a message
   */
  async updateMessage(
    cbId: bigint,
    data: Partial<{
      body: string;
      senderId: bigint;
      receiverId: bigint;
    }>
  ): Promise<Message> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.message.update({
        where: { cbId },
        data,
      });
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(cbId: bigint): Promise<void> {
    const prisma = PrismaService.getInstance();
    
    try {
      await prisma.message.delete({
        where: { cbId },
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Get all messages
   */
  async getAllMessages(): Promise<Message[]> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.message.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting all messages:', error);
      throw error;
    }
  }

  /**
   * Get message count by thread ID
   */
  async getMessageCountByThreadId(threadId: bigint): Promise<number> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.message.count({
        where: { threadId },
      });
    } catch (error) {
      console.error('Error getting message count by thread ID:', error);
      throw error;
    }
  }
} 