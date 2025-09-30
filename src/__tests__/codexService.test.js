const codexService = require('../services/codexService');

// Mock the OpenAI SDK
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ text: 'Mocked completion' }],
          usage: { total_tokens: 30 }
        })
      },
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Mocked chat response' } }],
            usage: { total_tokens: 40 }
          })
        }
      }
    }))
  };
});

describe('CodexService', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  test('should initialize with API key', () => {
    expect(codexService.client).toBeDefined();
  });

  test('should handle code completion', async () => {
    const result = await codexService.completeCode('function hello() {');
    expect(result.success).toBe(true);
    expect(result.completion).toBe('Mocked completion');
  });

  test('should handle code generation', async () => {
    const result = await codexService.generateCode('Create a hello world function', 'javascript');
    expect(result.success).toBe(true);
    expect(result.code).toBe('Mocked chat response');
    expect(result.language).toBe('javascript');
  });
});
