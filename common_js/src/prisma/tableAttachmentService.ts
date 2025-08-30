import PrismaService from './client';

export interface TableAttachment {
  cbId: bigint;
  messageId: bigint;
  createdAt: Date;
  columns: any;
  rows: any;
}

export interface TableAttachmentWithMessage extends TableAttachment {
  message: {
    cbId: bigint;
    body: string;
    threadId: bigint;
  };
}

export class TableAttachmentService {
  private static instance: TableAttachmentService;

  static getInstance(): TableAttachmentService {
    if (!TableAttachmentService.instance) {
      TableAttachmentService.instance = new TableAttachmentService();
    }
    return TableAttachmentService.instance;
  }

  /**
   * Get table attachment by CB ID
   */
  async getTableAttachment(cbId: bigint): Promise<TableAttachmentWithMessage | null> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.tableAttachment.findUnique({
        where: { cbId },
        include: {
          message: {
            select: {
              cbId: true,
              body: true,
              threadId: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error getting table attachment:', error);
      throw error;
    }
  }

  /**
   * Get table attachments by message ID
   */
  async getTableAttachmentsByMessageId(messageId: bigint): Promise<TableAttachment[]> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.tableAttachment.findMany({
        where: { messageId },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      console.error('Error getting table attachments by message ID:', error);
      throw error;
    }
  }

  /**
   * Create a new table attachment
   */
  async createTableAttachment(data: {
    messageId: bigint;
    columns: any;
    rows: any;
  }): Promise<TableAttachment> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.tableAttachment.create({
        data: {
          messageId: data.messageId,
          columns: data.columns,
          rows: data.rows,
        },
      });
    } catch (error) {
      console.error('Error creating table attachment:', error);
      throw error;
    }
  }

  /**
   * Update a table attachment
   */
  async updateTableAttachment(
    cbId: bigint,
    data: Partial<{
      columns: any;
      rows: any;
    }>
  ): Promise<TableAttachment> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.tableAttachment.update({
        where: { cbId },
        data,
      });
    } catch (error) {
      console.error('Error updating table attachment:', error);
      throw error;
    }
  }

  /**
   * Delete a table attachment
   */
  async deleteTableAttachment(cbId: bigint): Promise<void> {
    const prisma = PrismaService.getInstance();
    
    try {
      await prisma.tableAttachment.delete({
        where: { cbId },
      });
    } catch (error) {
      console.error('Error deleting table attachment:', error);
      throw error;
    }
  }

  /**
   * Get all table attachments
   */
  async getAllTableAttachments(): Promise<TableAttachment[]> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.tableAttachment.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting all table attachments:', error);
      throw error;
    }
  }

  /**
   * Get table attachment count by message ID
   */
  async getTableAttachmentCountByMessageId(messageId: bigint): Promise<number> {
    const prisma = PrismaService.getInstance();
    
    try {
      return await prisma.tableAttachment.count({
        where: { messageId },
      });
    } catch (error) {
      console.error('Error getting table attachment count by message ID:', error);
      throw error;
    }
  }
} 