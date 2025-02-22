import axios from 'axios';

const API_TOKEN = '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'; // Same token as above

export async function getLegalResponse(query: string): Promise<string> {
  try {
    console.log('Chatbot query:', query);
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/deepset/roberta-base-squad2',
      {
        inputs: {
          question: query,
          context: 'This is a legal assistance bot. It provides basic answers about contracts, tenant rights, and general legal queries. For detailed advice, consult a lawyer.',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
      }
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










//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