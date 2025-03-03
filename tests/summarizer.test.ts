import 'dotenv/config';
import { summarizeText } from '../src/summarizer';

describe('summarizer', () => {
  test('summarizes text correctly', async () => {
    const text = 'This is a long message. It has many details. We should summarize it.';
    const summary = await summarizeText(text);
    expect(summary).toContain('summarize');
  }, 15000); // Increase timeout to 15 seconds

  test('summarizes mock PDF text', async () => {
    const pdfText = 'This is a legal document about contracts.';
    const summary = await summarizeText(pdfText);
    expect(summary).toContain('contract');
  }, 15000); // Increase timeout to 15 seconds
});