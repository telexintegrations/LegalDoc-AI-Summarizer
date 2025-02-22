import 'dotenv/config';
import { getLegalResponse } from '../src/chatbot';

describe('chatbot', () => {
  test('responds to contract query', async () => {
    const response = await getLegalResponse('What is a contract?');
    expect(response).not.toBe('Error processing your question'); // Check it’s not an error
  });
});