// Create a temporary test file to verify the ToolCallResult import
const { ToolCallResult } = require('../common_js/dist/src/types/tool-call-result');

console.log('ToolCallResult:', ToolCallResult);
console.log('ToolCallResult.success:', ToolCallResult.success);

// Test creating a success result
const result = ToolCallResult.success('test-tool', { count: 5 }, 'test-call-id', BigInt(123));
console.log('Created result:', result);
console.log('Result status:', result.status);
console.log('Result content:', result.content);
