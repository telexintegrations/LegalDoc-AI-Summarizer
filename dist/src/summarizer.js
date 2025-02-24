"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeText = summarizeText;
const axios_1 = __importDefault(require("axios"));
async function withRetry(fn, retries = 3, delay = 10000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) && error.response?.status === 503 && i < retries - 1) {
                console.log(`Retrying (${i + 1}/${retries}) after 503 error...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            else {
                throw error;
            }
        }
    }
}
async function summarizeText(text) {
    const API_TOKEN = process.env.HUGGING_FACE_TOKEN;
    if (!API_TOKEN) {
        throw new Error('HUGGING_FACE_TOKEN is not set in .env');
    }
    try {
        console.log('Summarizing text:', text);
        const response = await withRetry(() => axios_1.default.post('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', { inputs: text }, {
            headers: { Authorization: `Bearer ${API_TOKEN}` },
            timeout: 1200000 // Increase to 60 seconds
        }));
        console.log('API response:', response.data);
        return response.data[0].summary_text || 'Could not summarize';
    }
    catch (error) {
        console.error('Summarization error:', error.message);
        if (axios_1.default.isAxiosError(error) && error.response) {
            console.error('Error details:', error.response.data);
        }
        return 'Error summarizing text';
    }
}
