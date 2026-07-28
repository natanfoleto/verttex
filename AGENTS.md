# AI Agent Readme — VERTTEX

Dear AI Agent, please refer to the main guidelines document located at [.ai/AGENT.md](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/AGENT.md).

## Priority Order of Document Reading

1. [.ai/README.md](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/README.md)
2. [.ai/AGENT.md](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/AGENT.md)
3. [.ai/security/AI_SECURITY_RULES.md](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/security/AI_SECURITY_RULES.md)
4. [.ai/roadmaps/INDEX.md](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/roadmaps/INDEX.md)
5. Roadmap ativo em `.ai/roadmaps/active/`
6. [.ai/architecture/ARCHITECTURE.md](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/architecture/ARCHITECTURE.md)
7. [.ai/domain/BUSINESS_RULES.md](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/domain/BUSINESS_RULES.md) / [.ai/domain/PERMISSIONS.md](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/domain/PERMISSIONS.md) / [.ai/domain/WORKFLOWS.md](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/domain/WORKFLOWS.md)
8. [.ai/backend/BACKEND_API.md](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/backend/BACKEND_API.md) / [.ai/frontend/FRONTEND_UI.md](file:///Users/natanfoleto/Desktop/prefeitura/verttex/.ai/frontend/FRONTEND_UI.md)
## Regra Mandatória de Testes Automatizados

Toda nova implementação, endpoint, serviço, funcionalidade, correção de bug ou roadmap **DEVE obrigatoriamente incluir a criação e execução de testes automatizados (Vitest)**. Nenhuma tarefa é considerada finalizada ou marcada como concluída sem a presença, execução e aprovação dos testes automatizados correspondentes cobrindo os cenários de sucesso e exceção.

## Regra Mandatória de Skeleton Loading no Frontend

Toda e qualquer página, modal, listagem ou tela com carregamento assíncrono de dados **DEVE obrigatoriamente utilizar componentes de Skeleton Loading (`animate-pulse`)** que espelhem com precisão o layout final da tela, eliminando telas em branco e spinners genéricos soltos.


# NO FINAL DOS ROADMAPS

Tudo está auditado?
Tudo está documentado?
Tudo tem testes?


### **CRITICAL VALIDATION: TEST COVERAGE (VITEST)**

Before considering any development cycle **complete**, you MUST verify and ensure the following regarding test coverage:

1. **Automated Tests Exist and Pass:**
   - Every new feature, endpoint, service, or bug fix **MUST include new or updated automated tests (Vitest)**.
   - The tests must execute successfully and pass the CI/CD pipeline.
   - No implementation should be marked as "finished" without passing tests.

2. **Test Documentation:**
   - All test scenarios (success, edge cases, error handling) must be documented in the respective test files.
   - Test behavior must be intuitive and easy to understand.

3. **Full Integration Coverage:**
   - Consider **integration tests** for flows involving multiple services (e.g., Order -> Payment -> Shipping).
   - Ensure database transactions are properly mocked or tested.

4. **No Test Coverage Bypass:**
   - Do not skip creating or updating tests to save time.
   - Test coverage is a **mandatory requirement** for considering a task completed.

