import { createApp } from './app.js';

const PORT = parseInt(process.env.PORT || '3000');
const { app } = createApp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Unraid Finder running at http://0.0.0.0:${PORT}`);
});
