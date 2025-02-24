"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const telexHandler_1 = require("../src/telexHandler");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/public', express_1.default.static(path_1.default.join(__dirname, '../public'))); // Serve public folder
exports.default = async (req, res) => {
    try {
        const event = req.body;
        console.log('Received event:', event);
        const response = await (0, telexHandler_1.handleTelexEvent)(event);
        res.json(response);
    }
    catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Something went wrong' });
    }
};
app.post('/webhook', async (req, res) => {
    try {
        const event = req.body;
        console.log('Received event:', event);
        const response = await (0, telexHandler_1.handleTelexEvent)(event);
        res.json(response);
    }
    catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            event_name: 'message_formatted',
            message: 'Error: Something went wrong',
            status: 'error',
            username: 'LegalAidSummaryBot'
        });
    }
});
const PORT = 5577;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
