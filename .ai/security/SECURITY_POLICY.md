# Política de Segurança — VERTTEX

> **Versão:** 1.0  
> **Data:** 2026-07-22  
> **Aplicação:** Todo o monorepo Verttex (API, Manager, Marketplace, infraestrutura, CI/CD)

---

## 1. Princípios Obrigatórios

### 1.1 Zero Trust
Nunca confiar automaticamente em:
- Frontend, aplicativo mobile, headers enviados pelo cliente
- IDs enviados pelo cliente em URL, query string ou body
- Campos ocultos, cookies sem validação, JWT sem validação completa
- Arquivos enviados (nome, MIME type, Content-Type, conteúdo)
- Dados provenientes de APIs externas
- Permissões apresentadas pela interface
- Preço, estoque, desconto calculados pelo navegador
- Tenant ou loja informados no body
- Status de pedido informado pelo usuário
- Resultados gerados por outra IA sem revisão humana

Todo dado externo deve ser considerado não confiável até prova em contrário.

### 1.2 Menor Privilégio
Usuários, serviços, banco de dados, CI/CD e tokens devem possuir somente os privilégios necessários para executar sua função.

### 1.3 Negação por Padrão
Quando nenhuma regra permitir explicitamente uma ação, a ação deve ser negada. O comportamento padrão é sempre restritivo.

### 1.4 Segurança em Todas as Requisições
Autenticação e autorização devem ser validadas pelo backend em todas as requisições protegidas. O frontend realiza ocultação de UI apenas para experiência do usuário — não substitui a validação backend.

### 1.5 Falha Segura
Em caso de erro, indisponibilidade de componente ou falha na validação de segurança, o comportamento padrão deve proteger o sistema. Exceções que optarem por disponibilidade em vez de segurança devem ser documentadas em `SECURITY_DECISIONS.md` com justificativa, responsável e prazo de revisão.

### 1.6 Separação de Responsabilidades
Separar sempre que viável: autenticação, autorização, regras de negócio, persistência, upload, auditoria, notificações e secrets.

### 1.7 Defesa em Profundidade
Cada camada de segurança deve ser segura de forma independente. A falha de uma camada não pode resultar automaticamente em comprometimento completo. Ver `SECURITY_ARCHITECTURE.md` para o modelo de camadas.

---

## 2. Regras de Desenvolvimento Seguro

### 2.1 Gate Obrigatório
Toda nova funcionalidade deve ser desenvolvida seguindo o modelo de desenvolvimento com IA definido em `AI_SECURITY_RULES.md`. Funcionalidades que alteram estado do sistema devem possuir:
- Testes de segurança (positivos e negativos)
- Registro de auditoria via `logAudit()`
- Documentação atualizada

### 2.2 Proibições Absolutas de Código

**SQL e ORM:**
- `$queryRaw`, `$executeRaw`, `$queryRawUnsafe`, `$executeRawUnsafe`
- `Prisma.raw`, `Prisma.sql`
- Concatenação manual de SQL

**Senhas e secrets:**
- Nunca armazenar senha em texto claro
- Nunca criptografar senha de forma reversível
- Nunca logar senha, token, secret ou dado de cartão
- Nunca hardcodar secrets no código ou em arquivos de configuração rastreados pelo Git

**Frontend:**
- Nunca usar `dangerouslySetInnerHTML` fora de componente centralizado, revisado e documentado
- Nunca calcular preços, descontos, permissões ou totais no frontend e confiar neles no backend

**IDs e ownership:**
- Nunca derivar tenant, loja ou dono de recurso a partir de campos enviados pelo cliente
- Sempre verificar ownership e autorização em nível de objeto

### 2.3 Obrigações

- Toda rota nova deve ter schema de validação (body, params, query)
- Toda rota protegida deve ter `preHandler` de autenticação
- Todo endpoint com dado de outro usuário deve validar ownership
- Toda alteração de permissão, cargo ou acesso deve ser auditada
- Todo novo endpoint deve ser adicionado à `ACCESS_CONTROL_MATRIX.md`
- Todo endpoint sensível deve ser adicionado à `RATE_LIMIT_MATRIX.md`

---

## 3. Responsabilidades

| Papel | Responsabilidade |
|:---|:---|
| Desenvolvedor | Seguir este documento e as regras em `AI_SECURITY_RULES.md` em toda implementação |
| IA colaboradora | Declarar suposições, não inventar que testes foram executados, seguir o modelo obrigatório de desenvolvimento |
| Revisão | Toda alteração crítica de segurança deve ser seguida de análise adversarial em contexto separado |

---

## 4. Comunicação de Vulnerabilidades

**Descoberta de vulnerabilidade durante desenvolvimento:**
- Registrar imediatamente em `SECURITY_BACKLOG.md`
- Classificar por severidade (Crítico, Alto, Médio, Baixo)
- Não esconder, ignorar ou postergar sem documentação

**Vulnerabilidade crítica em produção:**
- Seguir o plano em `INCIDENT_RESPONSE.md`
- Notificar responsável técnico imediatamente
- Avaliar comunicação conforme LGPD se houver dados pessoais envolvidos

---

## 5. Nível ASVS Alvo

| Área | Nível ASVS Alvo |
|:---|:---|
| Geral | Nível 2 |
| Autenticação | Nível 3 |
| Autorização e permissões | Nível 3 |
| Administração | Nível 3 |
| Gestão de sessões | Nível 3 |
| Alteração de credenciais | Nível 3 |
| Pagamentos e operações financeiras | Nível 3 (quando implementado) |

---

## 6. Preparação para Pentest

O sistema será submetido futuramente a um pentest profissional. A preparação começa agora. Ver `PENTEST_READINESS.md`.
