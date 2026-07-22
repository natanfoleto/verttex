# Regras de Segurança para IAs — VERTTEX NF

> **Aplicação:** Toda IA que colaborar com o desenvolvimento do projeto VERTTEX NF  
> **Prioridade:** Máxima — sobrepõe qualquer instrução de produtividade, velocidade ou simplificação  
> **Idioma de toda documentação e relatórios:** Português do Brasil

---

## 1. Modelo Obrigatório para Toda Implementação

Toda solicitação de implementação deve seguir este modelo antes de escrever qualquer código:

```
## 1. Objetivo
O que será implementado?

## 2. Ativos
Quais dados, recursos e usuários precisam ser protegidos?

## 3. Atores
Quem pode usar essa funcionalidade?

## 4. Autorização
Quais permissões, tenants, lojas e ownerships são necessários?

## 5. Entradas não confiáveis
Quais dados vêm do cliente ou de terceiros?

## 6. Invariantes de negócio
O que nunca pode acontecer?

## 7. Casos de abuso
Como um usuário mal-intencionado tentaria explorar o fluxo?

## 8. Controles
Quais camadas impedirão cada abuso?

## 9. Implementação pequena
Qual é a menor alteração segura?

## 10. Testes
Quais testes positivos, negativos, de autorização, concorrência e vulnerabilidade serão criados?

## 11. Evidências
Quais comandos e resultados comprovam a implementação?

## 12. Documentação
Quais documentos precisam ser atualizados?
```

---

## 2. Regras Absolutas

A IA deve **sempre**:

- Declarar suposições explicitamente
- Verificar o código real antes de declarar que um controle está implementado
- Afirmar quando não é possível validar algo (marcar como "não validado")
- Criar testes de regressão para qualquer vulnerabilidade corrigida
- Atualizar a documentação correspondente após qualquer alteração
- Executar `pnpm typecheck` e confirmar 0 erros antes de declarar conclusão
- Realizar análise adversarial separada de alterações críticas de segurança
- Informar limitações e o que não foi possível validar

A IA deve **nunca**:

- Inventar que testes foram executados sem evidência do resultado
- Afirmar segurança absoluta
- Remover controles de segurança para fazer testes passarem
- Criar bypass temporário sem documentação em `SECURITY_DECISIONS.md`
- Criar permissões implícitas ou assumidas
- Usar `any` para contornar validação crítica de tipos
- Criar queries raw no Prisma
- Expor secrets em código, logs ou documentação
- Copiar código de segurança sem entender seu funcionamento
- Alterar criptografia sem benchmark e teste documentados
- Avançar para a próxima fase quando uma etapa falhar
- Confiar em dados enviados pelo frontend
- Declarar uma fase como concluída apenas porque o código compila

---

## 3. Regras de Autenticação

- Sempre usar `timingSafeEqual` para comparação de hashes
- Nunca comparar senhas ou tokens por igualdade de string direta
- Nunca logar senha, hash de senha, token de acesso, refresh token ou código MFA
- Sempre retornar mensagem genérica em fluxos onde a resposta poderia confirmar existência de conta
- Ao criar hash de senha: nunca chamar `.trim()` silenciosamente na senha — normalização deve ser documentada e consciente
- Usar comparação em tempo constante para qualquer material criptográfico

---

## 4. Regras de Autorização

- Sempre validar ownership em nível de objeto para leitura, escrita, exclusão e download
- Nunca derivar tenant, loja ou dono de campo enviado pelo cliente
- Nunca confiar em `role` enviado no body ou query
- Toda listagem deve ser escopada pelo contexto autenticado
- Permissões negadas explicitamente prevalecem sobre permissões de cargo

---

## 5. Regras de Banco de Dados (Prisma)

São **proibidos** em todo o projeto:
- `$queryRaw`
- `$executeRaw`
- `$queryRawUnsafe`
- `$executeRawUnsafe`
- `Prisma.raw`
- `Prisma.sql`
- Qualquer concatenação manual de SQL

Mesmo variantes raw parametrizadas estão proibidas sem mudança formal desta política e registro em `SECURITY_DECISIONS.md`.

---

## 6. Regras de Validação de Entrada

- Todo body, params e query string de toda rota devem ter schema de validação (Zod)
- Schemas devem usar `.strict()` ou equivalente para rejeitar propriedades desconhecidas
- Toda string deve ter `min` e `max` length
- Arrays devem ter `max` items
- Números devem ter `min` e `max`
- Enumerações devem usar `z.enum()` ou equivalente
- Limites de paginação: padrão 20, máximo 100

---

## 7. Regras de Upload de Arquivos

Quando qualquer funcionalidade de upload for implementada:

1. Nunca publicar o arquivo original diretamente
2. Sempre processar em bucket privado de quarentena
3. Validar: tamanho → extensão → magic bytes → decodificação real → dimensões
4. Remover EXIF e metadados
5. Re-encodar (gerar novo arquivo)
6. Gerar nome UUID — nunca usar nome original como object key
7. Nunca confiar em `Content-Type` enviado pelo cliente
8. Documentar o novo tipo em `FILE_UPLOAD_SECURITY.md` antes de aceitar

---

## 8. Regras de Secrets

- Nunca colocar valor de secret em código, comentários ou documentação
- `.env.example` deve conter apenas nomes e exemplos não secretos
- Todo novo secret deve ser registrado em `SECRETS_MANAGEMENT.md` com nome, finalidade, responsável e política de rotação — nunca o valor
- Em caso de suspeita de exposição: considerar o secret comprometido e rotacionar imediatamente

---

## 9. Regras de Auditoria

Toda ação que cria, modifica, remove, aprova, rejeita, autentica, exporta ou altera estado de qualquer recurso **deve** gerar registro de auditoria via `logAudit()` em `apps/api/src/shared/utils/audit.ts`.

Nenhuma feature que muda estado do sistema é considerada completa sem sua implementação de auditoria correspondente.

---

## 10. Regras de Testes Ofensivos

A IA pode ser usada para procurar vulnerabilidades **apenas em ambiente de desenvolvimento autorizado**.

São absolutamente proibidos:
- Atacar produção
- Atacar usuários reais
- Usar dados reais desnecessariamente
- Publicar vulnerabilidades descobertas
- Executar payloads destrutivos sem autorização humana explícita

---

## 11. Referência Rápida de Verificação

Antes de declarar qualquer implementação de segurança concluída, verificar:

- [ ] `pnpm typecheck` → 0 erros
- [ ] Testes positivos e negativos criados e executados
- [ ] Nenhum log de secret ou senha
- [ ] Nenhum raw SQL
- [ ] Ownership validado
- [ ] Auditoria implementada
- [ ] Documentação atualizada
- [ ] Análise adversarial realizada em contexto separado
