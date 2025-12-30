# sistema.ax

Sistema de gestão para **Ax Festas** — controle de estoque, reservas, manutenção e financeiro, com site público para reservas de itens de festas.

Status: Scaffold inicial criado. Próximo passo: implementar API de itens e modelagem do banco.

Stack sugerido (padrão para o MVP):
- Frontend público + Admin: **Next.js (React)**
- Backend: **NestJS** (Node.js)
- Banco de dados: **PostgreSQL**
- Autenticação: JWT com roles (admin/cliente)
- Pagamentos: **Pix** (opcional no MVP, recomendado)

Diretórios iniciais:
- `apps/frontend` — código do frontend (Next.js)
- `apps/backend` — código do backend (NestJS)
- `infra` — infraestrutura e config do devcontainer
- `docs` — documentação de identidade visual e requisitos
- `design` — tokens de design (cores, fontes)

Como contribuir (rápido):
1. Crie uma branch por feature: `git checkout -b feat/nome-da-feature`
2. Siga as convenções de commits e abra PR para `main`

Observações:
- Fonts provisórias: *Lucky Bones* e *Autun* podem requerer licença; *Open Sans* é do Google Fonts.
- Veja `docs/IDENTIDADE.md` para as diretrizes de marca.

---

Se tudo estiver ok, começo a modelar o banco e criar as primeiras migrations e endpoints de `items`.