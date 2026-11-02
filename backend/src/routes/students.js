import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { audit } from '../services/audit.js';

const router = Router();
const studentSchema = z.object({ fullName: z.string().trim().min(2).max(120), dateOfBirth: z.string().date(), schoolId: z.string().uuid(), guardianPhone: z.string().max(30).optional() });

router.post('/', authenticate, allowRoles('ADMIN', 'OFFICER'), async (req, res, next) => {
  try {
    const input = studentSchema.parse(req.body);
    const { rows } = await pool.query('INSERT INTO students(full_name,date_of_birth,school_id,guardian_phone) VALUES($1,$2,$3,$4) RETURNING id, full_name, date_of_birth, school_id', [input.fullName, input.dateOfBirth, input.schoolId, input.guardianPhone || null]);
    await audit(req.user.sub, 'STUDENT_CREATED', 'student', rows[0].id);
    res.status(201).json(rows[0]);
  } catch (error) { if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid student data', details: error.flatten() }); next(error); }
});

// BOLA/IDOR defense: every lookup is constrained to the caller's permitted school.
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, full_name, date_of_birth, school_id FROM students WHERE id=$1 AND ($2 = \'ADMIN\' OR school_id = $3)', [req.params.id, req.user.role, req.user.schoolId || null]);
    if (!rows[0]) return res.status(404).json({ error: 'Student not found' });
    await audit(req.user.sub, 'STUDENT_VIEWED', 'student', req.params.id);
    res.json(rows[0]);
  } catch (error) { next(error); }
});
export default router;

