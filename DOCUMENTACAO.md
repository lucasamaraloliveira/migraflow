# 🚀 MigraFlow - Sistema de Gestão de Migração de Dados

O **MigraFlow** é uma plataforma avançada de monitoramento e gestão de projetos de migração de dados, projetada para oferecer visibilidade total, automação via IA e ferramentas de colaboração técnica.

---

## 🛠️ Stack Tecnológica

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore & Auth)
- **Inteligência Artificial**: [Google Gemini AI](https://deepmind.google/technologies/gemini/) (Modelo: `gemini-3.1-flash-lite-preview`)
- **Visualização de Dados**: [Recharts](https://recharts.org/)
- **Animações**: [Framer Motion](https://www.framer.com/motion/)

---

## ✨ Principais Funcionalidades

### 1. Dashboard de Controle
- **Visão Geral**: Gráficos de volumetria e progresso consolidado de todas as migrações.
- **Lista de Migrações**: Ordenação alfabética (A-Z/Z-A) e filtragem por status.
- **Resumo Executivo**: Indicadores de performance (KPIs) em tempo real, incluindo pastas realizadas, estudos enviados e storage (TB).

### 2. Gestão de Detalhes (Migration View)
- **Estrutura por Grupos**: Organização de discos por unidades lógicas ou departamentos.
- **Monitoramento de Unidade**: Acompanhamento individual de status (Pendente, Realizando, Pausado, Realizado).
- **Cálculo Automático**: O progresso total é calculado dinamicamente com base nas pastas concluídas.

### 3. Inteligência Artificial (IA)
- **Assistente Chatbot**: Janela flutuante estilo chatbot para dúvidas e suporte em tempo real.
- **Geração de Insights**: Relatórios executivos gerados automaticamente com base no contexto técnico dos discos e comentários.
- **Processamento de Markdown**: A IA gera relatórios formatados (negrito, listas, títulos) para facilitar a leitura.

### 4. Colaboração Técnica
- **Comentários Técnicos**: Inserção de notas de engenharia por disco.
- **Níveis de Severidade**: Classificação de observações (Sem Prioridade, Baixa, Média, Alta, Urgente) com indicadores coloridos.
- **Hover Preview**: Pré-visualização rápida de comentários ao passar o mouse, sem necessidade de abrir modais.

### 5. Segurança e Acesso
- **Controle de Acesso por Papéis**:
  - **Técnico/Admin**: Acesso total (IA, edição, exclusão, comentários).
  - **Visitante (Guest)**: Acesso de leitura, IA e funções de edição ocultas.
- **Integração Firebase**: Autenticação segura e sincronização em tempo real.

---

## 📂 Estrutura de Arquivos

- `app/page.tsx`: Componente principal que orquestra o Dashboard e a visualização detalhada.
- `app/api/ai/route.ts`: Endpoint de integração com o Google Gemini.
- `hooks/use-firestore.ts`: Hooks personalizados para operações de CRUD e listen em tempo real com Firebase.
- `lib/firebase.ts`: Configuração do SDK do Firebase.
- `components/`: Componentes reutilizáveis (Modais, Inputs, Badges).

---

## 🚀 Como Executar o Projeto

1. **Instalação**:
   ```bash
   npm install
   ```

2. **Configuração**:
   Crie um arquivo `.env.local` com as seguintes chaves:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   GEMINI_API_KEY=...
   ```

3. **Desenvolvimento**:
   ```bash
   npm run dev
   ```

---

## 📈 Regras de Negócio Importantes

- **Cores de Progresso**: O sistema utiliza azul para progresso em andamento e **verde esmeralda** para projetos 100% concluídos.
- **Contexto de IA**: A IA lê todos os `Comentários Técnicos` e suas `Severidades` para gerar recomendações estratégicas precisas.
- **Importação de Dados**: Suporte para carregamento de listas de discos via arquivos Excel/CSV.

---

© 2026 MigraFlow - Engineering & Data Migration Control.
