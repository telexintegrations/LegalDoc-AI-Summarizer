import axios from 'axios';

async function withRetry(fn: () => Promise<any>, retries = 2, delay = 3000): Promise<any> {
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

export async function summarizeText(text: string): Promise<string> {
  const API_TOKEN = process.env.HUGGING_FACE_TOKEN;
  if (!API_TOKEN) {
    throw new Error('HUGGING_FACE_TOKEN is not set in .env');
  }
  try {
    console.log('Summarizing text:', text);
    const response = await withRetry(() =>
      axios.post(
        'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
        { inputs: text },
        {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
          timeout: 30000
        }
      )
    );
    console.log('API response:', response.data);
    return response.data[0].summary_text || 'Could not summarize';
  } catch (error) {
    console.error('Summarization error:', (error as any).message);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error details:', error.response.data);
    }
    return 'Error summarizing text';
  }
}