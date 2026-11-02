import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { audit } from '../services/audit.js';
const router = Router();
const paymentSchema = z.object({ studentId: z.string().uuid(), amount: z.coerce.number().positive().max(100000) });

router.post('/', authenticate, allowRoles('ADMIN', 'OFFICER'), async (req, res, next) => {
  const key = req.get('Idempotency-Key');
  if (!key) return res.status(400).json({ error: 'Idempotency-Key header is required' });
  const bodyHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT request_hash,response_status,response_body FROM idempotency_keys WHERE key=$1 AND method=$2 FOR UPDATE', [key, req.method]);
    if (existing.rows[0]) {
      if (existing.rows[0].request_hash !== bodyHash) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Idempotency key reused with a different payload' }); }
      await client.query('ROLLBACK'); return res.status(existing.rows[0].response_status).json(existing.rows[0].response_body);
    }
    const input = paymentSchema.parse(req.body);
    const payment = await client.query('INSERT INTO scholarship_payments(student_id,amount,status) VALUES($1,$2,\'PAID\') RETURNING id,student_id,amount,status', [input.studentId, input.amount]);
    const response = payment.rows[0];
    await client.query('INSERT INTO idempotency_keys(key,method,request_hash,response_status,response_body) VALUES($1,$2,$3,201,$4)', [key, req.method, bodyHash, response]);
    await client.query('COMMIT');
    await audit(req.user.sub, 'PAYMENT_CREATED', 'payment', response.id, { amount: response.amount });
    res.status(201).json(response);
  } catch (error) { await client.query('ROLLBACK'); if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payment data' }); next(error); }
  finally { client.release(); }
});
export default router;

