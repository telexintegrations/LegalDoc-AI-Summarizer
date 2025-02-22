import { summarizeText } from './summarizer';
import { getLegalResponse } from './chatbot';
import axios from 'axios';
import * as pdfParse from 'pdf-parse';
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

// Helper function to summarize long texts by chunking
async function summarizeLongText(text: string): Promise<string> {
  const maxLength = 500; // Max characters per chunk
  if (text.length <= maxLength) return summarizeText(text);
  const chunks = text.match(new RegExp(`.{1,${maxLength}}`, 'g')) || [];
  const summaries = await Promise.all(chunks.map(chunk => summarizeText(chunk)));
  return summaries.join(' ');
}

export async function handleTelexEvent(event: TelexEvent): Promise<TelexResponse> {
  if (!event) {
    return {
      text: 'Error: Invalid event format.',
      channelId: 'unknown',
    };
  }

  // Handle message.created events
  if (event.type === 'message.created' && event.message) {
    const { text, channelId } = event.message;

    if (!text || !channelId) {
      return {
        text: 'Error: Message must include text and channelId.',
        channelId: channelId || 'unknown',
      };
    }

    if (text.startsWith('/legal')) {
      const query = text.replace('/legal', '').trim();
      const answer = await getLegalResponse(query);
      return { text: answer, channelId };
    } else {
      const summary = await summarizeLongText(text); // Use long-text summarization
      return { text: `${text}\nSummary: ${summary}`, channelId };
    }
  }

  // Handle file.uploaded events
  if (event.type === 'file.uploaded' && event.file) {
    const { url, channelId } = event.file;

    if (!url || !channelId) {
      return {
        text: 'Error: File event must include URL and channelId.',
        channelId: channelId || 'unknown',
      };
    }

    try {
      // Fetch file once with a timeout
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 seconds
      });
      const fileBuffer = Buffer.from(response.data);
      let fileText: string;

      // Determine file type and extract text
      if (url.endsWith('.pdf')) {
        const pdfData = await pdfParse.default(fileBuffer);
        fileText = pdfData.text;
      } else if (url.endsWith('.docx')) {
        const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
        fileText = docxData.value;
      } else {
        return {
          text: 'Error: Unsupported file type. Only .pdf and .docx are supported.',
          channelId,
        };
      }

      console.log('Extracted file text:', fileText); // Debug log

      if (!fileText) {
        return { text: 'Error: No text found in file.', channelId };
      }

      const summary = await summarizeLongText(fileText); // Use long-text summarization
      return { text: `File Summary: ${summary}`, channelId };
    } catch (error) {
      console.error('File processing error:', (error as Error).message);
      return { text: 'Error: Failed to process file.', channelId };
    }
  }

  return {
    text: 'Error: Unsupported event type.',
    channelId: 'unknown',
  };
}