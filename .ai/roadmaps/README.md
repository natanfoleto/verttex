# Roadmaps Oficiais — VERTTEX NF

> **Categoria:** Planos Executáveis de Desenvolvimento e Histórico de Entregas  
> **Localização:** `.ai/roadmaps/`

---

## 1. Finalidade

A pasta `.ai/roadmaps/` rastreia **o que foi construído, o que está sendo construído e o que será construído** no ecossistema VERTTEX NF — oferecendo contexto histórico, limites claros de escopo e rastreabilidade com evidências.

Toda a documentação técnica e planos de execução estão centralizados sob o diretório `.ai/`.

---

## 2. Estrutura de Pastas

```text
.ai/roadmaps/
├── README.md          — Este arquivo
├── INDEX.md           — Índice consolidado de todos os roadmaps
├── active/            — Roadmaps atualmente em execução (máximo 1 ativo por vez)
├── planned/           — Roadmaps planejados e aprovados, aguardando início
├── completed/         — Roadmaps totalmente concluídos e validados
└── archived/          — Roadmaps cancelados, substituídos ou obsoletos
```

---

## 3. Convenção de Nomenclatura

Os arquivos utilizam numeração sequencial de três dígitos:

```text
001-foundation.md
002-data-modeling.md
003-user-authentication.md
004-customer-authentication.md
005-roles-and-permissions.md
006-stores-management.md
007-manager-ui.md
008-marketplace-ui.md
```

Regras:
- Letras minúsculas
- Nomes técnicos claros em inglês ou português
- Hífen separando palavras
- Os números nunca são reusados
- Manter a numeração de roadmaps arquivados intacta

---

## 4. Status e Ciclo de Vida

| Status | Pasta | Descrição |
|:---|:---|:---|
| `planned` | `planned/` | Definido, aprovado e aguardando início de implementação |
| `active` | `active/` | Em desenvolvimento ativo (somente 1 por vez, salvo independência documentada) |
| `completed` | `completed/` | Totalmente implementado, testado e validado com evidências |
| `archived` | `archived/` | Cancelado, substituído ou descontinuado (motivo documentado) |

---

## 5. Critérios Rigorosos de Conclusão

Um roadmap somente poderá ser movido para `completed/` quando:
1. Todas as etapas obrigatórias tiverem sido implementadas.
2. Os testes tiverem sido executados e aprovados.
3. A documentação relacionada tiver sido atualizada.
4. Não existirem pendências bloqueadoras.
5. Houver evidências verificáveis da conclusão.

*Código gerado ou compilação bem-sucedida, isoladamente, não constituem conclusão de roadmap.*

---

## 6. Modelo de Roadmap

```markdown
# Roadmap NNN — Nome do Roadmap

## Metadados
- Status: [planned | active | completed | archived]
- Prioridade: [critical | high | medium | low]
- Criado em: YYYY-MM-DD
- Iniciado em: YYYY-MM-DD
- Concluído em: YYYY-MM-DD
- Dependências: Roadmap XXX, Roadmap YYY

## Objetivos
## Escopo
## Fora do Escopo
## Regras de Negócio Aplicáveis
## Alterações na API / Banco de Dados / UI
## Passos de Implementação
## Testes e Validações
## Critérios de Aceite e Evidências
## Registro de Alterações
```
