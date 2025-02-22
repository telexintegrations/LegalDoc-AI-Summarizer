import axios from 'axios';

async function withRetry(fn: () => Promise<any>, retries = 3, delay = 5000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 503 && i < retries - 1) {
        console.log(`Retrying (${i + 1}/${retries}) after 503 error...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

export async function getLegalResponse(query: string): Promise<string> {
  const API_TOKEN = process.env.HUGGING_FACE_TOKEN;
  if (!API_TOKEN) {
    throw new Error('HUGGING_FACE_TOKEN is not set in .env');
  }
  try {
    console.log('Chatbot query:', query);
    const response = await withRetry(() =>
      axios.post(
        'https://api-inference.huggingface.co/models/deepset/roberta-base-squad2',
        {
          inputs: {
            question: query,
            context: 'This is a legal assistance bot. It provides basic answers about contracts (legally binding agreements), tenant rights (protections for renters), and general legal queries. For detailed advice, consult a lawyer.',
          },
        },
        {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
          timeout: 30000
        }
      )
    );
    console.log('Chatbot response:', response.data);
    return response.data.answer || 'I’m not sure, try asking a lawyer!';
  } catch (error) {
    console.error('Chatbot error:', (error as any).message);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error details:', error.response.data);
    }
    return 'Error processing your question';
  }
}