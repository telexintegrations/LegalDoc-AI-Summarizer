import express, { Express, Request, Response } from 'express';
import { handleTelexEvent } from './telexHandler';
import { integrationConfig } from './integrationconfig';
import cors from "cors";


const app: Express = express();
app.use(express.json());
app.use(cors()); // use before the routes

app.get('/integration-json', (req: Request, res: Response) => {
  res.json(integrationConfig)

});



app.post('/webhook', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    console.log('Received event:', event);
    const response = await handleTelexEvent(event);
    res.json(response);
  } catch (error) {
    console.error('Error:', (error as Error).message);
    res.status(500).json({
      event_name: 'message_formatted',
      message: 'Error: Something went wrong',
      status: 'error',
      username: 'LegalAidSummaryBot'
    });
  }
});

const PORT: number = 5577;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});