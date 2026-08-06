# Plano de Testes Manuais — Verttex Manager

Este documento fornece um roteiro completo de testes manuais para homologação de todas as funcionalidades e telas do **Verttex Manager (`apps/manager`)**.

---

## 🔑 Credenciais de Acesso de Teste (Seed Atualizada)

- **URL do Manager**: `http://localhost:3002/login`
- **Administrador Global (Acesso Completo)**:
  - **E-mail**: `admin@verttexloja.com.br`
  - **Senha**: `SenhaSegura123!`
- **Operador de Estoque (Acesso Operacional)**:
  - **E-mail**: `operador@verttexloja.com.br`
  - **Senha**: `SenhaSegura123!`

---

## 📋 Roteiro de Testes por Módulo

### Módulo 1: Autenticação & Acesso ao Sistema

- [x] **TC-01 — Login Válido**: Acesse `/login`, digite `admin@verttexloja.com.br` e `SenhaSegura123!`. Verifique se é direcionado ao Dashboard (`/`) com mensagem de boas-vindas.
- [x] **TC-02 — Login Inválido**: Tente logar com senha incorreta. Verifique se o aviso de erro é exibido sem quebrar a tela.
- [ ] **TC-03 — Esqueci minha Senha**: Teste o fluxo em `/esqueci-minha-senha`.
- [x] **TC-04 — Perfil do Usuário & Logout**: Clique no seu avatar no canto superior direito (`Meu perfil` e `Encerrar sessão`).

---

### Módulo 2: Gestão de Pedidos & Expedição Sanitária FEFO (`/pedidos`)

- [ ] **TC-05 — Listagem de Pedidos**: Acesse `/pedidos` e veja a lista de pedidos com os badges de status (`Pendente`, `Pago`, `Em Trânsito`, `Entregue`, `Cancelado`).
- [ ] **TC-06 — Filtros & Busca**: Teste o campo de busca por nome/código e o filtro por status.
- [ ] **TC-07 — Expedição Sanitária FEFO**: Clique no botão **"Expedir (FEFO)"** de um pedido pago (`PAID`). Preencha o código de rastreamento (ex: `BR123456789BR`), selecione a transportadora e a margem de validade sanitária (dias FEFO). Confirme e verifique se o status muda para _Em Trânsito_.
- [ ] **TC-08 — Confirmação de Entrega**: No pedido em trânsito, clique em **"Confirmar Entrega"** e valide a transição para _Entregue_.

---

### Módulo 3: Trocas, Devoluções & Quarentena Sanitária (`/devolucoes`)

- [ ] **TC-09 — Solicitações de Devolução**: Acesse `/devolucoes` e analise a lista de devoluções abertas por compradores.
- [ ] **TC-10 — Entrada em Quarentena**: Em uma solicitação pendente, clique em **"Entrada em Quarentena"** e verifique a alteração do status para _Em Quarentena Sanitária_.
- [ ] **TC-11 — Emissão de Laudo Técnico**: Clique em **"Emitir Laudo"** e teste as opções:
  - _Aprovado (Liberação Sanitária)_: retorna o item ao estoque comercial.
  - _Reprovado (Descarte por Avaria / Expiração)_: registra a baixa sanitária por descarte.
- [ ] **TC-12 — Processar Reembolso**: Clique no botão **"Processar Reembolso"** para encerrar o ciclo financeiro do pedido devolvido.

---

### Módulo 4: Central de Notificações & Alertas Sanitários (`/notificacoes`)

- [ ] **TC-13 — Listagem de Alertas**: Acesse `/notificacoes` e veja os alertas sanitários de validade de lotes (faixas de 180, 90, 60, 30, 15, 7, 1 dia e Vencido).
- [ ] **TC-14 — Filtro por Leitura**: Alterne entre as abas _Todas_ e _Não Lidas_.
- [ ] **TC-15 — Marcar Notificação como Lida**: Clique em **"Marcar como Lida"** em uma notificação não lida.
- [ ] **TC-16 — Executar Checagem de Lotes**: Clique no botão **"Executar Checagem de Lotes"** no topo da página e verifique o aviso de varredura executada em tempo real.

---

### Módulo 5: Relatórios Comerciais & Curva ABC (`/relatorios`)

- [ ] **TC-17 — KPI Cards Executivos**: Acesse `/relatorios` e valide a exibição dos cards de _Faturamento Total_, _Ticket Médio_ e _Perdas Sanitárias_.
- [ ] **TC-18 — Tabela da Curva ABC**: Verifique o ranking de produtos com a classificação de inteligência (Classe A: 80%, Classe B: 15%, Classe C: 5%).
- [ ] **TC-19 — Exportação de Relatórios**: Alterne o seletor entre **CSV** e **JSON** e clique em **"Exportar Relatório"** para baixar o arquivo no seu computador.

---

### Módulo 6: Catálogo, Estoque & Lotes Sanitários (`/produtos`, `/estoque`, `/categorias`, `/marcas`)

- [ ] **TC-20 — Catálogo de Produtos (`/produtos`)**: Navegue pelos produtos cadastrados na seed ("Queijo Canastra", "Mel Silvestre").
- [ ] **TC-21 — Estoque & Lotes (`/estoque`)**: Acesse e verifique os lotes semeados com diferentes estados sanitários:
  - `L-2026-CAN-01`: Lote Válido (+150 dias de validade).
  - `L-2026-CAN-02`: Lote Próximo do Vencimento (+18 dias - Alerta de saída FEFO).
  - `L-2026-CAN-03`: Lote Vencido (Vencido há 6 dias - Requer descarte).
  - `L-2026-MEL-01`: Lote em Quarentena Sanitária.
- [ ] **TC-22 — Categorias & Marcas (`/categorias`, `/marcas`)**: Teste a visualização e cadastro.

---

### Módulo 7: Gestão de Acessos & Auditoria (`/lojas`, `/usuarios`, `/cargos`, `/auditoria`)

- [ ] **TC-23 — Lojas Parceiras (`/lojas`)**: Consulte as lojas parceiras semeadas (_Queijaria Alvorada_ e _Apiário Serra Verde_).
- [ ] **TC-24 — Usuários Gestores (`/usuarios`)**: Visualize os usuários e ative/desative um usuário de teste.
- [ ] **TC-25 — Cargos & Permissões (`/cargos`)**: Acesse a matriz RBAC e confira os papéis (`Administrador Global`, `Operador`, `Produtor`, `Gerente`, `Auditor`).
- [ ] **TC-26 — Logs de Auditoria (`/auditoria`)**: Acesse a auditoria e verifique se as ações realizadas durante seus testes acima foram registradas com IP, usuário, data e payload de alterações.
