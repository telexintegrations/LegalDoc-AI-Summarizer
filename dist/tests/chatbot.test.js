"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const chatbot_1 = require("../src/chatbot");
describe('chatbot', () => {
    test('responds to contract query', async () => {
        const response = await (0, chatbot_1.getLegalResponse)('What is a contract?');
        expect(response).not.toBe('Error processing your question'); // Check it’s not an error
    });
});
