"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const summarizer_1 = require("../src/summarizer");
describe('summarizer', () => {
    test('summarizes text correctly', async () => {
        const text = 'This is a long message. It has many details. We should summarize it.';
        const summary = await (0, summarizer_1.summarizeText)(text);
        expect(summary).toContain('summarize');
    }, 15000); // Increase timeout to 15 seconds
    test('summarizes mock PDF text', async () => {
        const pdfText = 'This is a legal document about contracts.';
        const summary = await (0, summarizer_1.summarizeText)(pdfText);
        expect(summary).toContain('contract');
    }, 15000); // Increase timeout to 15 seconds
});
