import axios from 'axios';

const API_TOKEN = process.env.HUGGING_FACE_TOKEN;

if (!API_TOKEN) {
  throw new Error('HUGGING_FACE_TOKEN is not set in .env');
}

export async function summarizeText(text: string): Promise<string> {
  try {
    console.log('Summarizing text:', text);
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
      }
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