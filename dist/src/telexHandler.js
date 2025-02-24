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
async function summarizeLongText(text) {
    const maxLength = 500; // Max characters per chunk
    if (text.length <= maxLength)
        return (0, summarizer_1.summarizeText)(text);
    const chunks = text.match(new RegExp(`.{1,${maxLength}}`, 'g')) || [];
    const summaries = await Promise.all(chunks.map(chunk => (0, summarizer_1.summarizeText)(chunk)));
    return summaries.join(' ');
}
async function handleTelexEvent(event) {
    if (!event || !event.channel_id) {
        return {
            event_name: 'message_formatted',
            message: 'Error: Invalid event format. Missing channel_id.',
            status: 'error',
            username: 'LegalAidSummaryBot'
        };
    }
    let maxMessageLength = 500; // Default max length
    let repeatWords = []; // Optional for Telex compatibility
    let repetitions = 1; // Optional for Telex compatibility
    // Extract Telex settings if provided
    if (event.settings) {
        for (const setting of event.settings) {
            switch (setting.label) {
                case 'Max Message Length':
                case 'maxMessageLength':
                    maxMessageLength = setting.default || 500;
                    break;
                case 'repeatWords':
                    repeatWords = setting.default?.split(', ') || [];
                    break;
                case 'noOfRepetitions':
                    repetitions = setting.default || 1;
                    break;
            }
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
            const answer = await (0, chatbot_1.getLegalResponse)(query);
            formattedMessage = answer;
        }
        else {
            const summary = await summarizeLongText(text);
            formattedMessage = `${text}\nSummary: ${summary}`;
        }
        // Apply Telex settings (truncate and repeat if needed)
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
            const response = await axios_1.default.get(url, { responseType: 'arraybuffer', timeout: 180000 });
            if (!response.data || !(response.data instanceof Buffer)) {
                return {
                    event_name: 'message_formatted',
                    message: 'Error: Invalid file data received.',
                    status: 'error',
                    username: 'LegalAidSummaryBot'
                };
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
            let formattedMessage = `File Summary: ${summary}`;
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
        catch (error) {
            console.error('File processing error:', error.message);
            if (axios_1.default.isAxiosError(error) && error.response) {
                console.error('Error details:', error.response.data.toString());
                return {
                    event_name: 'message_formatted',
                    message: `Error: Failed to process file - ${error.response.statusText}`,
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
