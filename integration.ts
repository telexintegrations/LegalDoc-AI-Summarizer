const baseUrl = 'https://legaldoc-ai-summarizer.onrender.com'


export const integrationConfig = {
  "data": {
    "date": {
      "created_at": "2025-02-24",
      "updated_at": "2025-02-24"
    },
    "descriptions": {
      "app_description": "LegalAidSummaryBot summarizes text messages, uploaded PDFs/DOCX, and provides legal assistance via /legal commands in Telex channels.",
      "app_logo": "https://iili.io/J8LyOLN.png",
      "app_name": "LegalAidSummaryBot",
      "app_url": baseUrl,
      "background_color": "#FFFFFF"
    },
    "integration_category": "AI & Machine Learning",
    "integration_type": "modifier",
    "is_active": true,
    "key_features": [
      "Text message summarization",
      "PDF and DOCX file summarization",
      "Legal assistance via /legal commands",
      "Real-time processing in Telex channels"
    ],
   "settings": [
      {
      "label": "Endpoint", 
      "type": "text", 
      "required": true, 
      "default": `${baseUrl}/webhook` 
      },
      { 
        "label": "Auth Token", 
        "type": "text", 
        "required": false, 
        "default": "YOUR_TELEX_AUTH_TOKEN_HERE"
       },
      { 
        "label": "Trigger Prefix",
         "type": "text",
          "required": true,
           "default": "/legal" 
      },
      {
         "label": "Max Message Length",
          "type": "number",
           "required": false, 
           "default": 500 
          },
      {
         "label": "Repeat Words", 
         "type": "multi-select", 
         "required": false, 
         "default": "contract, rights" 
        },
      { 
        "label": "Number of Repetitions", 
        "type": "number", 
        "required": false,
         "default": 2 
        }
    ],
    "target_url": `${baseUrl}/webhook`
  }
}
