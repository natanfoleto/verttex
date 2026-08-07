export function isLocalHost(hostname: string): boolean {
  if (!hostname) return false
  // Strip brackets from IPv6 hostnames like [::1]
  const cleanHost = hostname.toLowerCase().replace(/^\[|\]$/g, '')

  // Strict allowed local hostnames only
  return (
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost === '::1' ||
    cleanHost === 'host.docker.internal' ||
    cleanHost === 'postgres' // Docker Compose service name in compose.yaml
  )
}

export function assertSafeLocalDatabaseUrl(urlToValidate?: string): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'DATABASE_URL não parece apontar para um PostgreSQL local. Configure uma conexão local antes de executar testes destrutivos.',
    )
  }

  const rawUrl = urlToValidate ?? process.env.DATABASE_URL

  if (!rawUrl || rawUrl.trim() === '') {
    throw new Error(
      'DATABASE_URL não parece apontar para um PostgreSQL local. Configure uma conexão local antes de executar testes destrutivos.',
    )
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error(
      'DATABASE_URL não parece apontar para um PostgreSQL local. Configure uma conexão local antes de executar testes destrutivos.',
    )
  }

  const protocol = parsed.protocol.toLowerCase()
  if (protocol !== 'postgres:' && protocol !== 'postgresql:') {
    throw new Error(
      'DATABASE_URL não parece apontar para um PostgreSQL local. Configure uma conexão local antes de executar testes destrutivos.',
    )
  }

  const hostname = parsed.hostname
  if (!isLocalHost(hostname)) {
    throw new Error(
      'DATABASE_URL não parece apontar para um PostgreSQL local. Configure uma conexão local antes de executar testes destrutivos.',
    )
  }
}
