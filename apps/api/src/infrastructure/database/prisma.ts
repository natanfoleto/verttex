import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { apiEnv } from '@verttex/env/api'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: apiEnv.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({
  adapter,
})
