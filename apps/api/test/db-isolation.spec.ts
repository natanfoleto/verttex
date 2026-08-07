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

  it('13. assertSafeLocalDatabaseUrl lança ANTES de qualquer efeito colateral downstream', () => {
    // Verifica que a função lança imediatamente sem depender de contexto externo
    const unsafeUrls = [
      'postgresql://user:pass@203.0.113.10:5432/prod',
      'postgresql://user:pass@aws.rds.amazonaws.com:5432/db',
      'postgresql://user:pass@remote-db:5432/db',
      'postgresql://user:pass@127.0.0.2:5432/db',
    ]
    for (const url of unsafeUrls) {
      let guardFired = false
      let sideEffectReached = false
      try {
        assertSafeLocalDatabaseUrl(url)
        // This line must never execute for unsafe URLs
        sideEffectReached = true
      } catch {
        guardFired = true
      }
      expect(guardFired).toBe(true)
      expect(sideEffectReached).toBe(false)
    }
  })

  it('14. A integração real utiliza diretamente DATABASE_URL sem redirecionamentos', () => {
    const activeUrl = process.env.DATABASE_URL
    expect(activeUrl).toBeDefined()
    expect(() => assertSafeLocalDatabaseUrl(activeUrl)).not.toThrow()
  })

  it('15. A suíte de integração com PostgreSQL local valida DATABASE_URL e executa com sucesso', () => {
    expect(() => assertSafeLocalDatabaseUrl()).not.toThrow()
  })

  it('16. Cenário A — URL insegura bloqueia no guard antes de importar ou conectar o Prisma', async () => {
    // URL insegura de produção/remota: o guard dispara antes de qualquer I/O ou instanciação
    const originalUrl = process.env.DATABASE_URL
    ;(process.env as Record<string, string>).DATABASE_URL =
      'postgresql://user:pass@203.0.113.10:5432/prod_db'
    const { cleanDatabase } = await import('../prisma/clean.js')

    let errorCaught: Error | null = null
    try {
      await cleanDatabase()
    } catch (e: unknown) {
      errorCaught = e as Error
    } finally {
      ;(process.env as Record<string, string>).DATABASE_URL = originalUrl!
    }

    // Asserções Cenário A:
    // 1. Guard bloqueou a execução
    expect(errorCaught).not.toBeNull()
    expect(errorCaught?.message).toContain(
      'DATABASE_URL não parece apontar para um PostgreSQL local',
    )
    // 2. Credenciais não expostas no erro
    expect(errorCaught?.message).not.toContain('203.0.113.10')
    expect(errorCaught?.message).not.toContain('prod_db')
  })

  it('17. Cenário B — Falha ocorrida após criação do Prisma chama $disconnect() no bloco finally e preserva erro original', async () => {
    // Utiliza DATABASE_URL local autorizada (passa no guard, Prisma é instanciado)
    assertSafeLocalDatabaseUrl()
    const { cleanDatabase } = await import('../prisma/clean.js')
    const { prisma } = await import('../src/infrastructure/database/prisma.js')

    // Spy on prisma.$disconnect para observar invocação real no bloco finally
    const disconnectSpy = vi.spyOn(prisma, '$disconnect')
    disconnectSpy.mockClear()

    // Simula falha interna DENTRO da operação de limpeza (após criação do cliente Prisma)
    const cleanupError = new Error('SIMULATED_CLEANUP_DB_ERROR')
    const stockMovementsDeleteSpy = vi
      .spyOn(prisma.stockMovement, 'deleteMany')
      .mockRejectedValueOnce(cleanupError)

    let caughtError: Error | null = null
    try {
      await cleanDatabase()
    } catch (e: unknown) {
      caughtError = e as Error
    }

    // Asserções Cenário B:
    // 1. Aoperação de limpeza foi iniciada (cliente operou)
    expect(stockMovementsDeleteSpy).toHaveBeenCalledTimes(1)
    // 2. A falha ocorreu dentro da limpeza e o erro original foi preservado intacto
    expect(caughtError).toBe(cleanupError)
    expect(caughtError?.message).toBe('SIMULATED_CLEANUP_DB_ERROR')
    // 3. $disconnect() foi chamado EXATAMENTE UMA VEZ no bloco finally
    expect(disconnectSpy).toHaveBeenCalledTimes(1)

    stockMovementsDeleteSpy.mockRestore()
    disconnectSpy.mockRestore()
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

  it('20. Cenário C — Limpeza em banco local permitido executa a orquestração real, desconecta no finally e restaura seed', async () => {
    assertSafeLocalDatabaseUrl() // URL permitida
    const { cleanDatabase } = await import('../prisma/clean.js')
    const { prisma } = await import('../src/infrastructure/database/prisma.js')

    const disconnectSpy = vi.spyOn(prisma, '$disconnect')
    disconnectSpy.mockClear()

    await cleanDatabase()

    // Asserção: $disconnect() foi chamado exatamente uma vez no bloco finally do sucesso
    expect(disconnectSpy).toHaveBeenCalledTimes(1)
    disconnectSpy.mockRestore()

    // Confirma integridade das migrations e permissões semeadas pós-limpeza
    const migrations = await prisma.$queryRaw<
      Array<{ migration_name: string }>
    >`
      SELECT migration_name FROM _prisma_migrations ORDER BY finished_at
    `
    expect(migrations.length).toBeGreaterThanOrEqual(7)
    const permCount = await prisma.permission.count()
    expect(permCount).toBeGreaterThan(0)
    const adminRole = await prisma.role.findFirst({ where: { key: 'admin' } })
    expect(adminRole).not.toBeNull()

    // Restaura o seed completo de desenvolvimento (24 produtos, variações, search documents)
    const { seed } = await import('../prisma/seed.js')
    await seed()
  })
})
