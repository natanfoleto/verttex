import Redis from 'ioredis'
import { apiEnv } from '@verttex/env/api'

let redisClient: Redis | null = null

if (apiEnv.REDIS_URL) {
  try {
    redisClient = new Redis(apiEnv.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      lazyConnect: false,
    })

    redisClient.on('error', (err) => {
      console.error('[REDIS] Erro na conexão com o Redis:', err.message)
    })

    redisClient.on('connect', () => {
      console.log('✅ [REDIS] Conectado com sucesso!')
    })
  } catch (err) {
    console.error('[REDIS] Falha ao inicializar cliente Redis:', err)
  }
}

export { redisClient }
