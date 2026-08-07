export function isLocalHost(hostname: string): boolean {
  if (!hostname) return false
  // Strip brackets from IPv6 hostnames like [::1]
  const cleanHost = hostname.toLowerCase().replace(/^\[|\]$/g, '')

  // Direct allowed local hostnames
  if (
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost === '::1' ||
    cleanHost === 'host.docker.internal' ||
    cleanHost === 'postgres' // Docker Compose service name in compose.yaml
  ) {
    return true
  }

  // IPv4 127.0.0.0/8 subnet check (127.0.0.1 - 127.255.255.254)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  const match = cleanHost.match(ipv4Regex)
  if (match) {
    const octet1 = parseInt(match[1]!, 10)
    const octet2 = parseInt(match[2]!, 10)
    const octet3 = parseInt(match[3]!, 10)
    const octet4 = parseInt(match[4]!, 10)
    if (
      octet1 === 127 &&
      octet2 >= 0 && octet2 <= 255 &&
      octet3 >= 0 && octet3 <= 255 &&
      octet4 >= 0 && octet4 <= 255
    ) {
      return true
    }
  }

  return false
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
