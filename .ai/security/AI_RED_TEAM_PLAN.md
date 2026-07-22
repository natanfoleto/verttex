# Plano de Red Team Assistido por IA — VERTTEX

> **Versão:** 1.0 — 2026-07-22  
> **Escopo:** Apenas ambiente de desenvolvimento/staging com dados fictícios  
> **Autorização:** Requer autorização formal antes de cada fase

---

## Regras Absolutas

É absolutamente proibido:
- Atacar produção ou usuários reais
- Atacar serviços de terceiros
- Usar dados reais de usuários ou clientes
- Ultrapassar o escopo autorizado
- Executar payloads destrutivos sem autorização humana explícita
- Publicar vulnerabilidades descobertas

---

## Ambiente Necessário

- Banco de dados isolado com dados fictícios
- Contas de teste: uma por cargo (admin, employee, supplier)
- Múltiplas lojas fictícias
- Logs habilitados
- Snapshot do banco para restauração
- Kill switch (forma de parar rapidamente)

---

## Fases

### Fase 1 — Mapeamento
- Inventariar todos os endpoints (OpenAPI/Swagger disponível em `/docs`)
- Mapear autenticação de cada endpoint
- Mapear permissões e ownership esperados
- Documentar fluxos de upload quando implementado

### Fase 2 — Autenticação
- Enumeração de usuários via timing
- Brute force limitado (ambiente controlado)
- Bypass de JWT (`alg: none`, assinatura inválida)
- Reutilização de refresh token
- Rate limit bypass (múltiplos IPs, múltiplos e-mails)
- Logout sem invalidação de token

### Fase 3 — Autorização (IDOR/BOLA/BFLA)
- Acessar objeto de outro usuário via ID na URL
- Escalar privilégios via mass assignment
- Cross-tenant: usuário de uma loja acessando outra
- Funcionário acessando endpoint admin

### Fase 4 — Validação de Entrada
- SQL Injection (mesmo com Prisma)
- XSS em campos de texto (nome, descrição, slug)
- Path traversal em parâmetros
- Header injection
- Payloads muito longos
- Poluição de objetos JSON

### Fase 5 — Arquivos (quando implementado)
- MIME spoofing
- Arquivo polyglot (ex: JPG+ZIP)
- Nome com path traversal
- Arquivo com EXIF/metadados maliciosos
- Decompression bomb
- SVG com script

### Fase 6 — Lógica de Negócio
- Repetição de requisição (replay)
- Concorrência (duas requisições simultâneas para o mesmo recurso)
- Transição de estado inválida

### Fase 7 — Relatório

Para cada vulnerabilidade encontrada:

```
ID:
Título:
Severidade:
Ativo afetado:
Pré-condições:
Passos para reprodução:
Resultado atual:
Resultado esperado:
Impacto:
Evidências:
Correção recomendada:
Teste de regressão proposto:
Status:
```

### Fase 8 — Correção e Reteste
1. Criar teste que reproduz a vulnerabilidade
2. Confirmar que o teste falha (vulnerabilidade reproduzida)
3. Corrigir
4. Confirmar que o teste passa
5. Executar suíte completa
6. Executar novo teste adversarial no fluxo corrigido
7. Atualizar documentação
8. Registrar decisão em `SECURITY_DECISIONS.md`
