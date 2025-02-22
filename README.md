# LegalAidSummaryBot

A Telex Modifier Integration that summarizes text messages, uploaded files (PDF and DOCX), and provides legal assistance via `/legal` commands.

## Description
This integration enhances Telex channels by:
- **Summarizing Text Messages**: Condenses long messages using AI-powered summarization (Hugging Face’s `facebook/bart-large-cnn`).
- **Summarizing Uploaded Files**: Extracts and summarizes text from `.pdf` and `.docx` files.
- **Legal Assistance Chatbot**: Answers basic legal queries (e.g., "What is a contract?") using a Q&A model (`deepset/roberta-base-squad2`).

It’s designed for legal professionals, students, or anyone needing quick insights from legal content in a Telex channel.

## Prerequisites
- **Node.js**: Install from [nodejs.org](https://nodejs.org/) (LTS version recommended, e.g., 20.x.x).
- **Git**: Install from [git-scm.com](https://git-scm.com/) for version control.
- **Hugging Face API Token**: Get one from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).

## Setup
Follow these steps to run the project locally on your Windows machine.

1. **Clone the Repository**:
   Open PowerShell and run:
   ```powershell
   git clone https://github.com/telex_integrations/LegalAidSummaryBot.git
   cd LegalAidSummaryBot

2 **Install Dependencies**:
npm install

3. **Configure the API Token**:

    Open src/summarizer.ts and src/chatbot.ts in a text editor (e.g., VS Code).
    Replace YOUR_HUGGING_FACE_TOKEN with your token, e.g., hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx. Explanation: The token authenticates requests to Hugging Face’s API for summarization and Q&A.

4. **npm start**