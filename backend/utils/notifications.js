const db = require('../config/database');

async function createNotificationsForAllUsers({
  actorUserId,
  title,
  message,
  module,
  entityId,
  eventType = 'system',
  includeActor = false
}) {
  const [users] = await db.query(
    `SELECT id FROM users WHERE is_active = 1 ${includeActor ? '' : 'AND id <> ?'}`,
    includeActor ? [] : [actorUserId]
  );

  if (!users.length) return;

  const values = users.map((u) => [
    u.id,
    title,
    message || null,
    module || null,
    entityId != null ? String(entityId) : null,
    eventType
  ]);

  await db.query(
    'INSERT INTO notifications (user_id, title, message, module, entity_id, event_type) VALUES ?',
    [values]
  );
}

module.exports = { createNotificationsForAllUsers };

