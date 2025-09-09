const { TCWrapperBackend, QueryType } = require('./dist/src/services/tcWrapperBackend');

const mockQBOProfile = {
  cbId: BigInt(1),
  ownerId: BigInt(1),
  realmId: 'test-realm',
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  expiresIn: 3600,
  refreshTokenExpiresIn: 7200,
  isSandbox: true,
  updatedAt: new Date(),
  viewer_context: { cbid: BigInt(1) },
  platform: 'qbo',
  get_base_url: () => 'https://sandbox-quickbooks.api.intuit.com/v3/company/test-realm'
};

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
};

async function testRun() {
  try {
    const wrapper = new TCWrapperBackend(BigInt(123), mockQBOProfile);
    console.log('Wrapper created successfully');
    
    console.log('About to call run method...');
    await wrapper.run(
      'test-tool-call-id',
      { query: 'test query' },
      'qb_data_size_retriever',
      QueryType.RETRIEVE,
      1,
      mockResponse
    );
    
    console.log('Run method completed');
    console.log('mockResponse.status called:', mockResponse.status.mock.calls.length, 'times');
    console.log('mockResponse.json called:', mockResponse.json.mock.calls.length, 'times');
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testRun();
