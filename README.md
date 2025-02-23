# LegalAidSummaryBot

A Telex Modifier Integration that summarizes text messages, uploaded files (PDF and DOCX), and provides legal assistance via `/legal` commands.

## Description
This integration enhances Telex channels by:
- Summarizing text messages and files (`.pdf`, `.docx`) using Hugging Face’s `facebook/bart-large-cnn`.
- Providing legal answers via `deepset/roberta-base-squad2`.

## Prerequisites
- Node.js (LTS)
- Git
- Hugging Face API Token

## Setup
1. Clone: `git clone https://github.com/telexintegrations/LegalDoc-AI-Summarizer.git`
2. Install: `npm install`
3. Configure `.env`: `HUGGING_FACE_TOKEN=your_token_here`
4. Start: `npm start`

## Testing Locally
- Use Postman with `http://localhost:5577/webhook`.
- Examples in README (from previous versions).

## Deployment
- **Vercel URL**: `https://legaldoc-ai-summarizer.onrender.com/webhookk`
- **integration.json URL**: `https://raw.githubusercontent.com/telexintegrations/LegalDoc-AI-Summarizer/main/integration.json`
- **Steps**:
  1. Deployed with Render (Build Command: `npm install && npm run build`, Start Command: `node ./dist/index.js`).
  2. Set `HUGGING_FACE_TOKEN` in Render Environment Variables.

## Screenshots
- **Text Summary**: ![Text Summary](screenshots/text-summary.png)
- **PDF Summary**: ![PDF Summary](screenshots/pdf-summary.png)
- **Chatbot Response**: ![Chatbot Response](screenshots/chatbot-response.png)