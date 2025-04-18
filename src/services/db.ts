
import pg from 'pg';
const { Pool } = pg;

// Connection Pool
const pool = new Pool({
  user: 'viber',
  host: 'localhost',
  database: 'viber_lounge',
  password: 'viber123',
  port: 5432,
});

export default pool;
