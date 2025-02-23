import { summarizeText } from './summarizer';
import { getLegalResponse } from './chatbot';
import axios from 'axios';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

interface TelexEvent {
  type: string;
  message?: { text: string; channelId: string };
  file?: { url: string; channelId: string };
}

interface TelexResponse {
  text: string;
  channelId: string;
}

async function summarizeLongText(text: string): Promise<string> {
  const maxLength = 500; // Max characters per chunk
  if (text.length <= maxLength) return summarizeText(text);
  const chunks = text.match(new RegExp(`.{1,${maxLength}}`, 'g')) || [];
  const summaries = await Promise.all(chunks.map(chunk => summarizeText(chunk)));
  return summaries.join(' ');
}

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

export async function handleTelexEvent(event: TelexEvent): Promise<TelexResponse> {
  if (!event) {
    return { text: 'Error: Invalid event format.', channelId: 'unknown' };
  }

  if (event.type === 'message.created' && event.message) {
    const { text, channelId } = event.message;
    if (!text || !channelId) {
      return { text: 'Error: Message must include text and channelId.', channelId: channelId || 'unknown' };
    }
    if (text.startsWith('/legal')) {
      const query = text.replace('/legal', '').trim();
      const answer = await getLegalResponse(query);
      return { text: answer, channelId };
    } else {
      const summary = await summarizeText(text);
      return { text: `${text}\nSummary: ${summary}`, channelId };
    }
  }

  if (event.type === 'file.uploaded' && event.file) {
    const { url, channelId } = event.file;
    if (!url || !channelId) {
      return { text: 'Error: File event must include URL and channelId.', channelId: channelId || 'unknown' };
    }

    try {
      const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
      if (!response.data || !(response.data instanceof Buffer)) {
        return { text: 'Error: Invalid file data received.', channelId };
      }

      const fileBuffer = Buffer.from(response.data);
      let fileText: string;

      if (url.endsWith('.pdf')) {
        const pdfData = await pdfParse(fileBuffer);
        fileText = pdfData.text;
      } else if (url.endsWith('.docx')) {
        const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
        fileText = docxData.value;
      } else {
        return { text: 'Error: Unsupported file type. Only .pdf and .docx are supported.', channelId };
      }

      console.log('Extracted file text:', fileText);
      if (!fileText) {
        return { text: 'Error: No text found in file.', channelId };
      }

      const summary = await withRetry(() => summarizeLongText(fileText));
      return { text: `File Summary: ${summary}`, channelId };
    } catch (error) {
      console.error('File processing error:', (error as Error).message);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error details:', error.response.data.toString());
        return { text: `Error: Failed to process file - ${error.response.statusText}`, channelId };
      }
      return { text: 'Error: Failed to process file.', channelId };
    }
  }

  return { text: 'Error: Unsupported event type.', channelId: 'unknown' };
}