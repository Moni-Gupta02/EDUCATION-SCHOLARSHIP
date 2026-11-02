import { pool } from '../db.js';
export const audit = (actorId, action, resourceType, resourceId, details = {}) =>
  pool.query('INSERT INTO audit_events(actor_id, action, resource_type, resource_id, details) VALUES ($1,$2,$3,$4,$5)', [actorId, action, resourceType, resourceId, details]);

