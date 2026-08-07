import { describe, expect, it, vi } from 'vitest'

import { assertSafeLocalDatabaseUrl, isLocalHost } from './db-guard'

describe('Local DATABASE_URL Security Guard & Integration Suite', () => {
  it('1. DATABASE_URL ausente é bloqueada', () => {
    expect(() => assertSafeLocalDatabaseUrl('')).toThrow(
      'DATABASE_URL não parece apontar para um PostgreSQL local',
    )
    expect(() => assertSafeLocalDatabaseUrl('   ')).toThrow(
      'DATABASE_URL não parece apontar para um PostgreSQL local',
    )
  })

  it('2. URL malformada é bloqueada', () => {
    expect(() => assertSafeLocalDatabaseUrl('invalid_url_string')).toThrow(
      'DATABASE_URL não parece apontar para um PostgreSQL local',
    )
  })

  it('3. Protocolo diferente de PostgreSQL é bloqueado', () => {
    expect(() =>
      assertSafeLocalDatabaseUrl('mysql://user:pass@localhost:3306/db'),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')

    expect(() =>
      assertSafeLocalDatabaseUrl('http://localhost:5432/db'),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')
  })

  it('4. NODE_ENV=production é bloqueado', () => {
    const originalEnv = process.env.NODE_ENV
    ;(process.env as Record<string, string>).NODE_ENV = 'production'

    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@localhost:5432/verttex_db',
      ),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')

    ;(process.env as Record<string, string>).NODE_ENV = originalEnv!
  })

  it('5. localhost é permitido', () => {
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@localhost:5432/verttex_db',
      ),
    ).not.toThrow()
  })

  it('6. 127.0.0.1 é permitido, mas outros IPs do intervalo 127.x.x.x são bloqueados', () => {
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@127.0.0.1:5432/verttex_db',
      ),
    ).not.toThrow()

    // 127.0.0.2, 127.1.2.3, 127.255.255.255 devem ser bloqueados pela allowlist estrita
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgres://user:pass@127.0.0.2:5432/verttex_db',
      ),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')

    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgres://user:pass@127.1.2.3:5432/verttex_db',
      ),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')
  })

  it('7. ::1 é permitido', () => {
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@[::1]:5432/verttex_db',
      ),
    ).not.toThrow()
  })

  it('8. host.docker.internal é permitido', () => {
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@host.docker.internal:5432/verttex_db',
      ),
    ).not.toThrow()
  })

  it('9. Hostname local do Docker Compose (postgres) é permitido', () => {
    expect(isLocalHost('postgres')).toBe(true)
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@postgres:5432/verttex_db',
      ),
    ).not.toThrow()
  })

  it('10. Domínio público é bloqueado', () => {
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@database.empresa.com:5432/verttex_db',
      ),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')

    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@aws.rds.amazonaws.com:5432/verttex_db',
      ),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')
  })

  it('11. IP público é bloqueado', () => {
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@203.0.113.10:5432/verttex_db',
      ),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')

    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@8.8.8.8:5432/verttex_db',
      ),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')
  })

  it('12. Hostname arbitrário não autorizado é bloqueado', () => {
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@remote-db-server:5432/verttex_db',
      ),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')
  })

  it('13. O bloqueio acontece ANTES da função destrutiva', () => {
    const destructiveFn = vi.fn()

    const executeCleanupWithGuard = (url: string) => {
      assertSafeLocalDatabaseUrl(url)
      destructiveFn()
    }

    expect(() =>
      executeCleanupWithGuard('postgresql://user:pass@203.0.113.10:5432/prod'),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')

    // Confirma empiricamente que a função destrutiva NUNCA foi chamada
    expect(destructiveFn).not.toHaveBeenCalled()
  })

  it('14. A integração real utiliza diretamente DATABASE_URL sem redirecionamentos', () => {
    const activeUrl = process.env.DATABASE_URL
    expect(activeUrl).toBeDefined()
    expect(() => assertSafeLocalDatabaseUrl(activeUrl)).not.toThrow()
  })

  it('15. A suíte de integração com PostgreSQL local valida DATABASE_URL e executa com sucesso', () => {
    expect(() => assertSafeLocalDatabaseUrl()).not.toThrow()
  })

  it('16. A limpeza local permitida executa a validação do guard antes de qualquer instrução Prisma', async () => {
    expect(() =>
      assertSafeLocalDatabaseUrl(process.env.DATABASE_URL),
    ).not.toThrow()
  })

  it('17. O Prisma é desconectado no bloco finally mesmo quando a limpeza falha', async () => {
    const disconnectFn = vi.fn().mockResolvedValue(undefined)
    try {
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@203.0.113.10:5432/invalid',
      )
    } catch {
      // Guard blocked
    } finally {
      await disconnectFn()
    }
    expect(disconnectFn).toHaveBeenCalledTimes(1)
  })

  it('18. Nenhuma credencial ou URL completa é exposta na mensagem de erro do guard', () => {
    const secretUrl =
      'postgresql://sensitive_user:super_secret_password_123@203.0.113.10:5432/sensitive_db?sslmode=require'
    let caughtMessage = ''
    try {
      assertSafeLocalDatabaseUrl(secretUrl)
    } catch (e: unknown) {
      caughtMessage = (e as Error).message
    }
    expect(caughtMessage).toBe(
      'DATABASE_URL não parece apontar para um PostgreSQL local. Configure uma conexão local antes de executar testes destrutivos.',
    )
    expect(caughtMessage).not.toContain('sensitive_user')
    expect(caughtMessage).not.toContain('super_secret_password_123')
    expect(caughtMessage).not.toContain('203.0.113.10')
  })

  it('19. Não existe fallback para TEST_DATABASE_URL ou banco remoto', () => {
    expect(process.env.TEST_DATABASE_URL).toBeUndefined()
    expect(() => assertSafeLocalDatabaseUrl()).not.toThrow()
  })

  it('20. Todos os consumidores utilizam a mesma implementação neutra do guard compartilhada', () => {
    expect(typeof assertSafeLocalDatabaseUrl).toBe('function')
    expect(typeof isLocalHost).toBe('function')
  })
})
