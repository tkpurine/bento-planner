import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { mkdirSync } from 'fs'

mkdirSync('./data', { recursive: true })

const sqlite = new Database('./data/bento.db')
const db = drizzle(sqlite)

migrate(db, { migrationsFolder: './drizzle/migrations' })
console.log('Migration complete')
sqlite.close()
