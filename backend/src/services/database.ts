import { Pool, PoolClient } from 'pg';
import { log } from '../utils/logger';
import { CBUser } from '../types';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Supabase requires SSL for all connections
    const sslConfig = {
      rejectUnauthorized: false,
      ssl: true
    };

    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: sslConfig,
      // Connection pool settings for Supabase
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test the connection
    this.pool.on('connect', () => {
      log.info('Connected to PostgreSQL database');
    });

    this.pool.on('error', (err: Error) => {
      log.error('Unexpected error on idle client', err);
    });
  }

  /**
   * Get user profile from the profiles table by cbid
   */
  async getUserProfile(cbid: bigint): Promise<CBUser | null> {
    let client: PoolClient | null = null;
    
    try {
      client = await this.pool.connect();
      
      const query = `
        SELECT 
          id,
          time_zone,
          created_at,
          user_id as auth_user_id
        FROM profiles 
        WHERE id = $1
      `;
      
      const result = await client.query(query, [cbid.toString()]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      
      // Create CBUser object matching the interface
      const cbUser: CBUser = {
        id: BigInt(row.id),
        time_zone: row.time_zone || undefined,
        created_at: row.created_at ? new Date(row.created_at) : new Date(),
        auth_user_id: row.auth_user_id || '',
        viewer_context: {
          cbid: BigInt(row.id),
        },
        cbid: BigInt(row.id),
        
        // Implement the required methods
        get_connected_remote_user: (platform) => ({
          viewer_context: {
            cbid: BigInt(row.id),
          },
          platform
        }),
        get_timezone: () => row.time_zone || 'America/New_York',
        get_full_name: () => 'John Doe', // TODO: Get from actual data
        get_email: () => 'john.doe@example.com', // TODO: Get from actual data
        get_phone: () => '+1234567890' // TODO: Get from actual data
      };


      
      return cbUser;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Database query error: ${errorMessage}`, { error: String(error), cbid: cbid.toString() });
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Close the database pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
} 