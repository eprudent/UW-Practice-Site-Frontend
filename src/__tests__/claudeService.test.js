const claudeService = require('../services/claudeService');

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ text: 'Mocked response' }],
          usage: { input_tokens: 10, output_tokens: 20 },
          model: 'claude-3-sonnet-20240229'
        })
      }
    }))
  };
});

describe('ClaudeService', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  test('should initialize with API key', () => {
    expect(claudeService.client).toBeDefined();
  });

  test('should handle chat requests', async () => {
    const result = await claudeService.chat('Hello, Claude!');
    expect(result.success).toBe(true);
    expect(result.content).toBe('Mocked response');
  });

  test('should handle code generation', async () => {
    const result = await claudeService.generateCode('Create a hello world function', 'javascript');
    expect(result.success).toBe(true);
    expect(result.code).toBe('Mocked response');
    expect(result.language).toBe('javascript');
  });
});
