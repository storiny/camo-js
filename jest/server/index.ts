import { agent } from 'supertest';
const server = agent(process.env.CAMO_URI as string);

export default server;
