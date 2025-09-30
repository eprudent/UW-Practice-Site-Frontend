const OpenAI = require('openai');

class CodexService {
  constructor() {
    this.client = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }) : null;
  }

  async completeCode(code, language = 'javascript') {
    try {
      if (!this.client) {
        throw new Error('OpenAI API key not configured');
      }
      const response = await this.client.completions.create({
        model: 'gpt-3.5-turbo-instruct',
        prompt: code,
        max_tokens: 500,
        temperature: 0.1,
        stop: ['\n\n', '```']
      });

      return {
        success: true,
        completion: response.choices[0].text,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(`Codex completion error: ${error.message}`);
    }
  }

  async generateCode(prompt, language = 'javascript') {
    try {
      if (!this.client) {
        throw new Error('OpenAI API key not configured');
      }
      const systemPrompt = `Generate ${language} code based on the following prompt. Make sure the code is functional, well-commented, and follows best practices.`;
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      });

      return {
        success: true,
        code: response.choices[0].message.content,
        language: language,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(`Codex generation error: ${error.message}`);
    }
  }

  async explainCode(code, language = 'javascript') {
    try {
      if (!this.client) {
        throw new Error('OpenAI API key not configured');
      }
      const prompt = `Explain this ${language} code in detail, including:
1. What the code does
2. How it works step by step
3. Key concepts and patterns used
4. Potential use cases

Code:
\`\`\`${language}
${code}
\`\`\``;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      });

      return {
        success: true,
        explanation: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(`Codex explanation error: ${error.message}`);
    }
  }

  async debugCode(code, language = 'javascript', errorMessage = '') {
    try {
      if (!this.client) {
        throw new Error('OpenAI API key not configured');
      }
      const prompt = `Debug this ${language} code. ${errorMessage ? `Error message: ${errorMessage}` : 'Identify potential issues and provide fixes.'}

Code:
\`\`\`${language}
${code}
\`\`\`

Please provide:
1. Identified issues
2. Fixed code
3. Explanation of the fixes`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      });

      return {
        success: true,
        debugResult: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(`Codex debugging error: ${error.message}`);
    }
  }

  async optimizeCode(code, language = 'javascript') {
    try {
      if (!this.client) {
        throw new Error('OpenAI API key not configured');
      }
      const prompt = `Optimize this ${language} code for better performance, readability, and maintainability. Provide the optimized version with explanations of improvements.

Code:
\`\`\`${language}
${code}
\`\`\``;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      });

      return {
        success: true,
        optimizedCode: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(`Codex optimization error: ${error.message}`);
    }
  }
}

module.exports = new CodexService();
