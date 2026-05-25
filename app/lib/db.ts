import mysql, { type Pool, type PoolOptions, type RowDataPacket } from "mysql2/promise";

declare global {
  var __parkingSvDbPool: Pool | undefined;
}

const dbConfig: PoolOptions = {
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "parking_sv_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
};

// Reutilizamos el pool en desarrollo para evitar conexiones duplicadas con hot reload.
export const db =
  globalThis.__parkingSvDbPool ??
  mysql.createPool({
    ...dbConfig,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__parkingSvDbPool = db;
}

export type DatabaseRow = RowDataPacket;
