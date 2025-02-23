"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Load .env synchronously
//console.log('Loaded token:', process.env.HUGGING_FACE_TOKEN); // Debug
require("./server"); // Start server after .env is loaded
