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

Testing Locally

Test the integration with Postman or Thunder Client before deploying.
Tools Needed

    Postman: Download from postman.com.
    Thunder Client: Install as a VS Code extension.

Example Requests

    Text Message Summarization:
        Method: POST
        URL: http://localhost:5577/webhook
        Body > Raw > JSON:
        json

{
  "type": "message.created",
  "message": {
    "text": "This is a long legal document about contracts and tenant rights that needs summarizing. It includes details about obligations, rights, and legal terms that are important for both parties involved.",
    "channelId": "test-channel"
  }
}
Expected Response:
json

    {
      "text": "This is a long legal document about contracts and tenant rights that needs summarizing. It includes details about obligations, rights, and legal terms that are important for both parties involved.\nSummary: This legal document outlines contracts, tenant rights, obligations, and key legal terms.",
      "channelId": "test-channel"
    }
    Explanation: Sends a message to be summarized.

Chatbot Query:

    Body:
    json

{
  "type": "message.created",
  "message": {
    "text": "/legal What is a contract?",
    "channelId": "test-channel"
  }
}
Expected Response:
json

    {
      "text": "a legally binding agreement",
      "channelId": "test-channel"
    }
    Explanation: Triggers the chatbot with a legal question.

PDF File Upload:

    Body:
    json

{
  "type": "file.uploaded",
  "file": {
    "url": "https://unec.edu.az/application/uploads/2014/12/pdf-sample.pdf",
    "channelId": "test-channel"
  }
}
Expected Response:
json

    {
      "text": "File Summary: [summary of the PDF content]",
      "channelId": "test-channel"
    }
    Explanation: Summarizes a sample PDF.

DOCX File Upload:

    Host a .docx file (e.g., via Google Drive with a direct link ending in .docx), then:
    json

{
  "type": "file.uploaded",
  "file": {
    "url": "https://your-public-url.docx",
    "channelId": "test-channel"
  }
}

        Explanation: Tests .docx summarization.


**lINK TO SCREENSHOT FOR TESTING** = C:\Users\USER\Documents\HNG12\stage 3 screenshot


//type .env