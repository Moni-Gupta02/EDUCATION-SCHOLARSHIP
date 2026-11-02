import 'dotenv/config';
import crypto from 'node:crypto';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import students from './routes/students.js';
import payments from './routes/payments.js';
import { errorHandler } from './middleware/error.js';
const app = express();
app.use(helmet()); app.use(cors({ origin: process.env.CORS_ORIGIN })); app.use(express.json({ limit: '100kb' }));
app.use((req, res, next) => { req.id = crypto.randomUUID(); next(); });
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/students', students); app.use('/api/payments', payments); app.use(errorHandler);
app.listen(process.env.PORT || 4000, () => console.log('API listening'));

