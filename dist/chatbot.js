"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLegalResponse = getLegalResponse;
const axios_1 = __importDefault(require("axios"));
async function withRetry(fn, retries = 3, delay = 5000) {
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
async function getLegalResponse(query) {
    const API_TOKEN = process.env.HUGGING_FACE_TOKEN;
    if (!API_TOKEN) {
        throw new Error('HUGGING_FACE_TOKEN is not set in .env');
    }
    try {
        console.log('Chatbot query:', query);
        const response = await withRetry(() => axios_1.default.post('https://api-inference.huggingface.co/models/deepset/roberta-base-squad2', {
            inputs: {
                question: query,
                context: 'This is a legal assistance bot. It provides basic answers about contracts (legally binding agreements), tenant rights (protections for renters), and general legal queries. For detailed advice, consult a lawyer.',
            },
        }, {
            headers: { Authorization: `Bearer ${API_TOKEN}` },
            timeout: 30000
        }));
        console.log('Chatbot response:', response.data);
        return response.data.answer || 'I’m not sure, try asking a lawyer!';
    }
    catch (error) {
        console.error('Chatbot error:', error.message);
        if (axios_1.default.isAxiosError(error) && error.response) {
            console.error('Error details:', error.response.data);
        }
        return 'Error processing your question';
    }
}
