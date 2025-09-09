import { TypeScriptExecutor } from '../tcWrapperExecutor';
import { SupabaseStorageService } from 'coralbricks-common';

// Mock the SupabaseStorageService
jest.mock('coralbricks-common', () => ({
  ...jest.requireActual('coralbricks-common'),
  SupabaseStorageService: jest.fn().mockImplementation(() => ({
    tryCache: jest.fn().mockResolvedValue([
      { CustomerRef: { name: 'Customer A' }, TotalAmt: 1000 },
      { CustomerRef: { name: 'Customer B' }, TotalAmt: 2000 }
    ])
  }))
}));

describe('TypeScriptExecutor CommonJS exports fix', () => {
  it('should handle CommonJS exports without throwing "exports is not defined" error', async () => {
    const typescriptCode = `
export type Output = { message: string };

async function run(context: { __userData: Record<string, any[]> }): Promise<Output> {
  return { message: 'Hello World' };
}

(async () => { return await run({ __userData }); })();
    `;

    const mockData = {
      'Invoice_abc123': [
        { CustomerRef: { name: 'Customer A' }, TotalAmt: 1000 },
        { CustomerRef: { name: 'Customer B' }, TotalAmt: 2000 }
      ]
    };

    const baseContext = {
      __userData: mockData,
      console: {
        log: (...args: any[]) => console.log('[Tool Execution]:', ...args),
        error: (...args: any[]) => console.error('[Tool Execution Error]:', ...args),
        warn: (...args: any[]) => console.warn('[Tool Execution Warning]:', ...args),
        info: (...args: any[]) => console.info('[Tool Execution Info]:', ...args)
      },
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      exports: {},
      module: { exports: {} },
      require: (id: string) => {
        throw new Error(`Module '${id}' is not available in this context`);
      }
    };

    const executor = new TypeScriptExecutor(
      typescriptCode,
      BigInt(123),
      'test-tool-call-id',
      baseContext
    );

    // This should not throw an error about exports being undefined
    const result = await executor.call_tool();
    
    expect(result.status).toBe('success');
    expect(result.content).toBeDefined();
    expect(result.content.output).toEqual({ message: 'Hello World' });
  });

  it('should handle TypeScript compilation and execution with direct execution', async () => {
    const typescriptCode = `
interface Customer {
  name: string;
  revenue: number;
}

export type Output = Customer[] | { error: string };

async function run(context: { __userData: Record<string, any[]> }): Promise<Output> {
  const data = context.__userData;
  
  const customers = data['Invoice_abc123'];
  if (!customers) {
    return { error: 'No customers found' };
  }
  return customers.sort((a, b) => b.TotalAmt - a.TotalAmt);
}

(async () => { return await run({ __userData }); })();
    `;

    const baseContext = {
      __userData: {
        'Invoice_abc123': [
          { CustomerRef: { name: 'Customer A' }, TotalAmt: 1000 },
          { CustomerRef: { name: 'Customer B' }, TotalAmt: 2000 }
        ]
      },
      console: {
        log: (...args: any[]) => console.log('[Tool Execution]:', ...args),
        error: (...args: any[]) => console.error('[Tool Execution Error]:', ...args),
        warn: (...args: any[]) => console.warn('[Tool Execution Warning]:', ...args),
        info: (...args: any[]) => console.info('[Tool Execution Info]:', ...args)
      },
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      exports: {},
      module: { exports: {} },
      require: (id: string) => {
        throw new Error(`Module '${id}' is not available in this context`);
      }
    };

    const executor = new TypeScriptExecutor(
      typescriptCode,
      BigInt(456),
      'test-tool-call-id-2',
      baseContext
    );

    const result = await executor.call_tool();
    
    expect(result.status).toBe('success');
    expect(result.content).toBeDefined();
    // The test should return sorted customers by TotalAmt (highest first)
    expect(result.content.output).toEqual([
      { CustomerRef: { name: 'Customer B' }, TotalAmt: 2000 },
      { CustomerRef: { name: 'Customer A' }, TotalAmt: 1000 }
    ]);
  });
}); 