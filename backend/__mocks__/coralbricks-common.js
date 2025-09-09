const mockTaskService = {
  createTask: jest.fn().mockResolvedValue({
    cbId: BigInt(456),
    handleForModel: 'TestTable_abc123'
  }),
  updateTaskStatus: jest.fn().mockResolvedValue(undefined)
};

const actual = jest.requireActual('coralbricks-common');

module.exports = {
  ...actual,
  TaskService: {
    getInstance: jest.fn(() => mockTaskService)
  },
  __mockTaskService: mockTaskService  // Export for test access
}; 