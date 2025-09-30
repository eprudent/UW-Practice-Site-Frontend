const Anthropic = require('@anthropic-ai/sdk');

class ClaudeService {
  constructor() {
    this.client = process.env.ANTHROPIC_API_KEY ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    }) : null;
  }

  async chat(message, model = 'claude-3-sonnet-20240229') {
    try {
      if (!this.client) {
        throw new Error('Anthropic API key not configured');
      }
      const response = await this.client.messages.create({
        model: model,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      });

      return {
        success: true,
        content: response.content[0].text,
        usage: response.usage,
        model: response.model
      };
    } catch (error) {
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  async generateCode(prompt, language = 'javascript') {
    try {
      if (!this.client) {
        throw new Error('Anthropic API key not configured');
      }
      const systemPrompt = `You are an expert ${language} developer. Generate clean, efficient, and well-commented code based on the user's prompt. Always include proper error handling and follow best practices.`;
      
      const response = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\nUser prompt: ${prompt}`
          }
        ]
      });

      return {
        success: true,
        code: response.content[0].text,
        language: language,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(`Claude code generation error: ${error.message}`);
    }
  }

  async analyzeCode(code, language = 'javascript') {
    try {
      if (!this.client) {
        throw new Error('Anthropic API key not configured');
      }
      const prompt = `Analyze this ${language} code and provide:
1. Code quality assessment
2. Potential bugs or issues
3. Performance improvements
4. Best practices recommendations
5. Security considerations

Code to analyze:
\`\`\`${language}
${code}
\`\`\``;

      const response = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return {
        success: true,
        analysis: response.content[0].text,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(`Claude code analysis error: ${error.message}`);
    }
  }

  async refactorCode(code, language = 'javascript', requirements = '') {
    try {
      if (!this.client) {
        throw new Error('Anthropic API key not configured');
      }
      const prompt = `Refactor this ${language} code to make it more maintainable, efficient, and readable. ${requirements ? `Additional requirements: ${requirements}` : ''}

Original code:
\`\`\`${language}
${code}
\`\`\`

Please provide the refactored code with explanations of the changes made.`;

      const response = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return {
        success: true,
        refactoredCode: response.content[0].text,
        language: language,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(`Claude code refactoring error: ${error.message}`);
    }
  }
}

module.exports = new ClaudeService();
