﻿import { summarizeText } from './summarizer';
import { getLegalResponse } from './chatbot';
import axios from 'axios';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

interface TelexEvent {
  type: string;
  channel_id: string; // Consistent with payload
  settings?: Array<{ label: string; type: string; default: any }>;
  message?: { text: string };
  file?: { url: string };
}

interface TelexResponse {
  event_name: string;
  message: string;
  status: string;
  username: string;
}

async function withRetry(fn: () => Promise<any>, retries = 3, delay = 10000): Promise<any> {
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

async function summarizeLongText(text: string): Promise<string> {
  const maxLength = 500;
  if (text.length <= maxLength) return summarizeText(text);
  const chunks = text.match(new RegExp(`.{1,${maxLength}}`, 'g')) || [];
  const summaries = await Promise.all(chunks.map(chunk => summarizeText(chunk)));
  return summaries.join(' ');
}

export async function handleTelexEvent(event: TelexEvent): Promise<TelexResponse> {
  if (!event || !event.channel_id) {
    return {
      event_name: 'message_formatted',
      message: 'Error: Invalid event format. Missing channel_id.',
      status: 'error',
      username: 'LegalAidSummaryBot'
    };
  }

  let maxMessageLength = 500;
  let repeatWords: string[] = [];
  let repetitions = 1;

  if (event.settings) {
    for (const setting of event.settings) {
      switch (setting.label) {
        case 'Max Message Length':
        case 'maxMessageLength':
          maxMessageLength = setting.default as number || 500;
          break;
        case 'repeatWords':
          repeatWords = (setting.default as string)?.split(', ') || [];
          break;
        case 'noOfRepetitions':
          repetitions = setting.default as number || 1;
          break;
      }
    }
  }

  if (!event.type) {
    if (event.message && event.message.text) {
      event.type = 'message.created';
    } else if (event.file && event.file.url) {
      event.type = 'file.uploaded';
    } else {
      return {
        event_name: 'message_formatted',
        message: 'Error: Unsupported event format. Missing type.',
        status: 'error',
        username: 'LegalAidSummaryBot'
      };
    }
  }

  if (event.type === 'message.created' && event.message && event.message.text) {
    const text = event.message.text;
    if (!text) {
      return {
        event_name: 'message_formatted',
        message: 'Error: Message must include text.',
        status: 'error',
        username: 'LegalAidSummaryBot'
      };
    }

    let formattedMessage = text;
    if (text.startsWith('/legal')) {
      const query = text.replace('/legal', '').trim();
      const answer = await getLegalResponse(query);
      formattedMessage = answer;
    } else {
      const summary = await summarizeLongText(text);
      formattedMessage = `${text}\nSummary: ${summary}`;
    }

    if (maxMessageLength && formattedMessage.length > maxMessageLength) {
      formattedMessage = formattedMessage.substring(0, maxMessageLength);
    }
    for (const word of repeatWords) {
      formattedMessage = formattedMessage.replace(new RegExp(`\\b${word}\\b`, 'g'), word + ' '.repeat(repetitions));
    }

    return {
      event_name: 'message_formatted',
      message: formattedMessage,
      status: 'success',
      username: 'LegalAidSummaryBot'
    };
  }

  if (event.type === 'file.uploaded' && event.file && event.file.url) {
    const url = event.file.url;
    if (!url) {
      return {
        event_name: 'message_formatted',
        message: 'Error: File event must include URL.',
        status: 'error',
        username: 'LegalAidSummaryBot'
      };
    }

    try {
      const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 180000 });
      if (!response.data || !(response.data instanceof Buffer)) {
        return {
          event_name: 'message_formatted',
          message: 'Error: Invalid file data received.',
          status: 'error',
          username: 'LegalAidSummaryBot'
        };
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
        return {
          event_name: 'message_formatted',
          message: 'Error: Unsupported file type. Only .pdf and .docx are supported.',
          status: 'error',
          username: 'LegalAidSummaryBot'
        };
      }

      console.log('Extracted file text:', fileText);
      if (!fileText) {
        return {
          event_name: 'message_formatted',
          message: 'Error: No text found in file.',
          status: 'error',
          username: 'LegalAidSummaryBot'
        };
      }

      const summary = await summarizeLongText(fileText);
      let formattedMessage = `File Summary: ${summary || 'Error summarizing text'}`;

      if (maxMessageLength && formattedMessage.length > maxMessageLength) {
        formattedMessage = formattedMessage.substring(0, maxMessageLength);
      }
      for (const word of repeatWords) {
        formattedMessage = formattedMessage.replace(new RegExp(`\\b${word}\\b`, 'g'), word + ' '.repeat(repetitions));
      }

      return {
        event_name: 'message_formatted',
        message: formattedMessage,
        status: 'success',
        username: 'LegalAidSummaryBot'
      };
    } catch (error) {
      console.error('File processing error:', (error as Error).message);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error details:', error.response.data.toString());
        return {
          event_name: 'message_formatted',
          message: 'Error: Failed to process file.',
          status: 'error',
          username: 'LegalAidSummaryBot'
        };
      }
      return {
        event_name: 'message_formatted',
        message: 'Error: Failed to process file.',
        status: 'error',
        username: 'LegalAidSummaryBot'
      };
    }
  }

  return {
    event_name: 'message_formatted',
    message: 'Error: Unsupported event type.',
    status: 'error',
    username: 'LegalAidSummaryBot'
  };
}