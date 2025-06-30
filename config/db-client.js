import { env } from "./env.js";
import mysql from "mysql2/promise";

const { HOST, DATABASE, PASSWORD, USER } = env;

async function initializeDb() {
    try {
        const connection = await mysql.createConnection({
            host: HOST,
            user: USER,
            password: PASSWORD,
        });

        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${DATABASE}\``);
        await connection.changeUser({ database: DATABASE }); // safer than `USE`
        
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS short_links (
                id INT AUTO_INCREMENT PRIMARY KEY,
                short_code VARCHAR(20) NOT NULL UNIQUE,
                url VARCHAR(255) NOT NULL
            )
        `);

        console.log('Table Created.');
        return connection;
    } catch (err) {
        console.error("DB Initialization Error:", err);
        process.exit(1);
    }
}

export const db = await initializeDb();