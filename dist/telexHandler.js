"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTelexEvent = handleTelexEvent;
const summarizer_1 = require("./summarizer");
const chatbot_1 = require("./chatbot");
const axios_1 = __importDefault(require("axios"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth = __importStar(require("mammoth"));
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
async function handleTelexEvent(event) {
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
            const answer = await (0, chatbot_1.getLegalResponse)(query);
            return { text: answer, channelId };
        }
        else {
            const summary = await (0, summarizer_1.summarizeText)(text);
            return { text: `${text}\nSummary: ${summary}`, channelId };
        }
    }
    if (event.type === 'file.uploaded' && event.file) {
        const { url, channelId } = event.file;
        if (!url || !channelId) {
            return { text: 'Error: File event must include URL and channelId.', channelId: channelId || 'unknown' };
        }
        try {
            const response = await axios_1.default.get(url, { responseType: 'arraybuffer', timeout: 30000 });
            if (!response.data || !(response.data instanceof Buffer)) {
                return { text: 'Error: Invalid file data received.', channelId };
            }
            const fileBuffer = Buffer.from(response.data);
            let fileText;
            if (url.endsWith('.pdf')) {
                const pdfData = await (0, pdf_parse_1.default)(fileBuffer);
                fileText = pdfData.text;
            }
            else if (url.endsWith('.docx')) {
                const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
                fileText = docxData.value;
            }
            else {
                return { text: 'Error: Unsupported file type. Only .pdf and .docx are supported.', channelId };
            }
            console.log('Extracted file text:', fileText);
            if (!fileText) {
                return { text: 'Error: No text found in file.', channelId };
            }
            const summary = await withRetry(() => (0, summarizer_1.summarizeText)(fileText));
            return { text: `File Summary: ${summary}`, channelId };
        }
        catch (error) {
            console.error('File processing error:', error.message);
            if (axios_1.default.isAxiosError(error) && error.response) {
                console.error('Error details:', error.response.data.toString());
                return { text: `Error: Failed to process file - ${error.response.statusText}`, channelId };
            }
            return { text: 'Error: Failed to process file.', channelId };
        }
    }
    return { text: 'Error: Unsupported event type.', channelId: 'unknown' };
}
