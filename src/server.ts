import { config } from 'dotenv';

import server from './app';

config({ path: '.env.example' });

const PORT = Number.parseInt(process.env.CAMO_PORT || '8081', 10);

server.listen(PORT);
console.log(`Camo server running on port ${PORT}`);

export {};
