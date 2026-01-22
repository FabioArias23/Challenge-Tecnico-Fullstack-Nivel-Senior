import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5434, // Tu puerto local
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'billing_challenge',
  entities: ['src/entities/**/*.entity.ts'], // Ruta para desarrollo
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});