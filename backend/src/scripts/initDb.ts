import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function initDb() {
  let connection;
  try {
    // Connect without database selected first to create it if needed
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
    });

    console.log('Connected to MySQL server.');

    const dbName = process.env.MYSQL_DATABASE || 'morse_mastery';
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log(`Database '${dbName}' dropped (if existed).`);
    await connection.query(`CREATE DATABASE \`${dbName}\``);
    console.log(`Database '${dbName}' created or confirmed.`);

    await connection.query(`USE \`${dbName}\``);

    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon to execute statements individually? 
    // mysql2 supports multipleStatements if enabled, but let's just split manually or enable it.
    // Reconnecting with multipleStatements enabled is safer for this script.
    await connection.end();

    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: dbName,
      multipleStatements: true
    });

    await connection.query(schemaSql);
    console.log('Schema executed successfully.');

  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

initDb();
