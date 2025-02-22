import express, { Express, Request, Response } from 'express';
import { handleTelexEvent } from './telexHandler';
import path from 'path';

const app: Express = express();
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, '../public'))); // Serve public folder

app.post('/webhook', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    console.log('Received event:', event);
    const response = await handleTelexEvent(event);
    res.json(response);
  } catch (error) {
    console.error('Error:', (error as Error).message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT: number = 5577;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});