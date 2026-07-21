import { apiEnv } from '@verttex/env/api'
import { buildApp } from './app'

const app = buildApp()

const start = async () => {
  try {
    const port = apiEnv.SERVER_PORT
    await app.listen({ port, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

const signals = ['SIGINT', 'SIGTERM'] as const
for (const signal of signals) {
  process.on(signal, async () => {
    app.log.info(`Received ${signal}, closing server connections.`)
    await app.close()
    process.exit(0)
  })
}

start()
