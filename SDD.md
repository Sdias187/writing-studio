# Software Design Document — Azoth

> **Versão:** 2.0  
> **Status:** Rascunho  
> **Nome do Projeto:** Azoth — Plataforma de Escrita Criativa

---

## Sumário

1. [Introdução](#1-introdução)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Modelo de Dados](#4-modelo-de-dados)
5. [API — Contratos](#5-api--contratos)
6. [Arquitetura do Frontend](#6-arquitetura-do-frontend)
7. [Design System & Temas](#7-design-system--temas)
8. [Funcionalidades por Prioridade](#8-funcionalidades-por-prioridade)
9. [Editor de Texto](#9-editor-de-texto)
10. [Fluxos de Navegação](#10-fluxos-de-navegação)
11. [Segurança & Dados](#11-segurança--dados)
12. [Performance](#12-performance)
13. [Futuro — Pontos de Extensão](#13-futuro--pontos-de-extensão)

---

## 1. Introdução

### 1.1 Propósito

O Azoth é uma aplicação web moderna para escritores, permitindo criar, organizar e escrever histórias em um ambiente bonito, minimalista e produtivo. O foco principal é a **experiência de escrita** — o editor é o coração do produto, e tudo ao redor existe para servir a quem escreve.

### 1.2 Público-Alvo

- Escritores iniciantes e profissionais
- Autores independentes
- Criadores de RPG
- Roteiristas
- Autores de fanfics
- Estudantes

### 1.3 Princípios de Design do Produto

1. **O editor é o centro** — cada funcionalidade existe para proteger ou melhorar o ato de escrever
2. **Calma como recurso de design** — a interface reduz distrações e transmite concentração
3. **Dados primeiro, sincronização depois** — a arquitetura trata dados locais como fonte da verdade; nuvem é camada, não dependência
4. **Modular desde o início** — cada módulo de funcionalidade é desacoplado para permitir IA, plugins e colaboração sem refatoração estrutural
5. **Offline-first** — o usuário nunca perde a capacidade de escrever, com ou sem internet

---

## 2. Arquitetura do Sistema

### 2.1 Visão Geral

```
┌─────────────────────────────────────────────────────┐
│                    Cliente Web                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  React    │  │  TipTap   │  │  Zustand (Store)  │  │
│  │  Router   │  │  Editor   │  │  + IndexedDB     │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │             │                  │             │
│  ┌────┴─────────────┴──────────────────┴──────────┐ │
│  │          Service Layer (API Client)             │ │
│  └────────────────────┬───────────────────────────┘ │
└────────────────────────┼────────────────────────────┘
                         │ HTTPS / REST
┌────────────────────────┼────────────────────────────┐
│              ASP.NET Core Web API                    │
│  ┌────────────────────────────────────────────────┐ │
│  │  Controllers → Services → Repositories          │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │ │
│  │  │  Auth     │  │ Project  │  │  Export       │  │ │
│  │  │  Module   │  │ Module   │  │  Module       │  │ │
│  │  └──────────┘  └──────────┘  └──────────────┘  │ │
│  └────────────────────────────────────────────────┘ │
│                       │                              │
│  ┌────────────────────┴───────────────────────────┐ │
│  │  PostgreSQL                                      │ │
│  │  + AWS S3 (futuro: assets/imagens)               │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 2.2 Arquitetura Offline-First

```
┌───────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   User Input      │────>│  Local Store      │────>│  Remote API │
│   (Editor/Forms)  │     │  (IndexedDB)      │     │  (quando    │
│                   │     │  Fonte da Verdade  │     │   online)   │
└───────────────────┘     └──────────────────┘     └─────────────┘
                                  │
                          ┌───────┴───────┐
                          │  Sync Engine   │
                          │  (futuro)      │
                          └───────────────┘
```

**Regras:**
- Todas as escritas vão primeiro para o IndexedDB (local)
- Se online, replica para o backend em background
- Se offline, fila de sync é armazenada localmente
- Conflitos resolvidos por Last-Write-Wins (LWW) com versão de documento

### 2.3 Decisões Técnicas e Justificativas

| Decisão | Alternativas | Por quê |
|---------|-------------|---------|
| React + Vite | Next.js, Remix | App 100% cliente com API separada; SSR não agrega valor para um editor |
| TipTap (ProseMirror) | Quill, Slate, Lexical | Extensibilidade, node schema customizado, comunidade ativa, maturidade |
| Zustand | Redux, Jotai, Context | Simplicidade, boilerplate mínimo, performance boa, fácil de tipar |
| IndexedDB (Dexie) | SQLite via WASM | Suporte nativo em browsers, sem WASM, sincronizável |
| ASP.NET Core | Node, Go, Python | Stack do ecossistema, maturidade, performance, familiaridade |
| PostgreSQL | SQLite, MySQL | Confiabilidade, tipos avançados (JSONB, array), full-text search nativo |

---

## 3. Stack Tecnológico

### 3.1 Frontend

| Categoria | Tecnologia | Versão | Propósito |
|-----------|-----------|--------|-----------|
| Framework | React | 19+ | UI declarativa, ecossistema |
| Build | Vite | 6+ | Dev server rápido, HMR |
| Linguagem | TypeScript | 5+ | Tipagem estática, segurança |
| Estilos | Tailwind CSS | 4+ | Utilitário rápido, design system via `@theme` |
| Componentes | shadcn/ui (Radix) | — | Acessibilidade, customização total |
| Editor | TipTap + ProseMirror | — | Editor rich text extensível |
| Animação | Motion | 12+ | Animações declarativas, layout animations |
| Estado global | Zustand | 5+ | Store leve, tipada |
| Cache/DB local | Dexie (IndexedDB) | — | Persistência offline estruturada |
| Formulários | React Hook Form + Zod | — | Validação tipada, performática |
| Ícones | Lucide React | — | SVG icons limpos, consistentes |
| Gerenciamento de queries | TanStack Query | — | Cache, refetch, mutations (quando online) |

### 3.2 Backend

| Categoria | Tecnologia |
|-----------|-----------|
| Runtime | ASP.NET Core 9+ |
| ORM | Entity Framework Core |
| Validação | FluentValidation |
| Autenticação | ASP.NET Core Identity + JWT |
| Testes | xUnit + Moq + Testcontainers |
| Documentação | Swagger/OpenAPI |

### 3.3 Infraestrutura

| Categoria | Tecnologia |
|-----------|-----------|
| Banco | PostgreSQL 17 |
| Migrações | EF Core Migrations |
| Cache (futuro) | Redis |
| Storage (futuro) | AWS S3 / Azure Blob |
| CI/CD | GitHub Actions |

---

## 4. Modelo de Dados

### 4.1 Diagrama de Entidades

```
┌──────────────────┐     ┌──────────────────┐
│      Project      │────>│     Chapter       │
│──────────────────│     │──────────────────│
│ id: UUID         │     │ id: UUID         │
│ title: string    │     │ projectId: UUID  │
│ description: text│     │ title: string    │
│ cover: string?   │     │ order: number    │
│ genre: string?   │     │ status: enum     │
│ createdAt: Date  │     │ wordCount: int   │
│ updatedAt: Date  │     │ createdAt: Date  │
│ userId: UUID?    │     │ updatedAt: Date  │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         │ 1:N                    │ 1:N
         │                        │
         │                ┌───────┴──────────┐
         │                │      Scene        │
         │                │──────────────────│
         │                │ id: UUID          │
         │                │ chapterId: UUID   │
         │                │ title: string     │
         │                │ content: JSON     │  ← ProseMirror JSON
         │                │ order: number     │
         │                │ wordCount: int    │
         │                │ createdAt: Date   │
         │                │ updatedAt: Date   │
         │                └───────────────────┘
         │
         ├──────────────────────────────────┐
         │ 1:N                              │ 1:N
         │                                  │
         ▼                                  ▼
┌──────────────────┐              ┌──────────────────┐
│    Character      │              │     Location      │
│──────────────────│              │──────────────────│
│ id: UUID         │              │ id: UUID         │
│ projectId: UUID  │              │ projectId: UUID  │
│ name: string     │              │ name: string     │
│ photo: string?   │              │ description: text│
│ age: number?     │              │ realm: string?   │
│ description: text│              │ climate: string? │
│ personality: text│              │ inhabitants: text│
│ goals: text      │              │ notes: text      │
│ appearance: text │              │ createdAt: Date  │
│ skills: string[] │              │ updatedAt: Date  │
│ relationships:   │              └──────────────────┘
│   CharacterRel[] │
│ notes: text      │
│ createdAt: Date   │
│ updatedAt: Date   │
└──────────────────┘
```

### 4.2 Entidades Adicionais

```yaml
Faction:
  id: UUID
  projectId: UUID
  name: string
  description: text
  members: Character[]     # N:N com Character
  leader: Character?
  notes: text

TimelineEvent:
  id: UUID
  projectId: UUID
  title: string
  date: string            # formato livre: "Ano 342 da Terceira Era"
  description: text
  order: number
  relatedCharacters: Character[]
  relatedLocations: Location[]

Research:
  id: UUID
  projectId: UUID
  title: string
  content: JSON           # ProseMirror JSON (editor próprio)
  tags: string[]
  attachments: Attachment[]
  createdAt: Date
  updatedAt: Date

Attachment:
  id: UUID
  researchId: UUID
  type: enum              # image, pdf, link
  url: string
  name: string

Note:
  id: UUID
  projectId: UUID
  title: string
  content: JSON
  tags: string[]
  pinned: boolean
  createdAt: Date
  updatedAt: Date

Comment:
  id: UUID
  targetType: enum        # scene, character, location
  targetId: UUID
  content: text
  createdAt: Date
  updatedAt: Date

Tag:
  id: UUID
  projectId: UUID
  name: string
  color: string?

Export:
  id: UUID
  projectId: UUID
  format: enum            # docx, md, txt, epub, pdf
  createdAt: Date
  status: enum            # pending, processing, completed, failed
  url: string?
```

### 4.3 Enumerações

```typescript
enum ChapterStatus {
  Draft = "draft",
  InRevision = "in_revision",
  Completed = "completed",
  Published = "published"
}

enum ExportFormat {
  DOCX = "docx",
  Markdown = "md",
  TXT = "txt",
  EPUB = "epub",    // futuro
  PDF = "pdf"       // futuro
}

enum AttachmentType {
  Image = "image",
  PDF = "pdf",
  Link = "link"
}

enum CommentTargetType {
  Scene = "scene",
  Character = "character",
  Location = "location",
  Research = "research"
}
```

### 4.4 Regras de Negócio

- Um **Projeto** contém múltiplos Capítulos, Personagens, Locais, etc.
- Um **Capítulo** contém múltiplas Cenas (ordenadas por `order`)
- Uma **Cena** contém o conteúdo em ProseMirror JSON (não markdown)
- **Tags** são compartilhadas entre cenas, personagens, locais e notas dentro de um projeto
- **Comentários** são privados (apenas o autor do projeto vê)
- A **Lixeira** retém itens deletados por 30 dias antes de purgar

---

## 5. API — Contratos

### 5.1 Estrutura Base

```yaml
Base URL: /api/v1
Formato: JSON
Autenticação: JWT Bearer (opcional para uso local)
Paginação:
  Request:  ?page=1&limit=20
  Response: { data: [], total: number, page: number, limit: number }
```

### 5.2 Endpoints

#### Auth

```
POST   /auth/register          { email, password, name }
POST   /auth/login              { email, password } → { token, user }
POST   /auth/refresh            { refreshToken }
POST   /auth/logout
```

#### Projects

```
GET    /projects                →  Project[]
POST   /projects                →  { title, description? }
GET    /projects/:id            →  Project (com counts)
PUT    /projects/:id            →  { title?, description?, cover? }
DELETE /projects/:id            →  move to trash
```

#### Chapters (aninhado em projeto)

```
GET    /projects/:pid/chapters                →  Chapter[]
POST   /projects/:pid/chapters                →  { title }
PUT    /projects/:pid/chapters/:id            →  { title?, status?, order? }
DELETE /projects/:pid/chapters/:id            →  soft delete
PUT    /projects/:pid/chapters/reorder        →  { ids: string[] } (ordenação)

GET    /projects/:pid/chapters/:id/export     →  file download (formato?format=docx)
```

#### Scenes (aninhado em capítulo)

```
GET    /projects/:pid/chapters/:cid/scenes               →  Scene[]
POST   /projects/:pid/chapters/:cid/scenes               →  { title }
GET    /projects/:pid/chapters/:cid/scenes/:id            →  Scene (com content)
PUT    /projects/:pid/chapters/:cid/scenes/:id            →  { title?, content?, order? }
DELETE /projects/:pid/chapters/:cid/scenes/:id            →  soft delete
PUT    /projects/:pid/chapters/:cid/scenes/reorder        →  { ids: string[] }
```

#### Characters

```
GET    /projects/:pid/characters              →  Character[]
POST   /projects/:pid/characters              →  Character
GET    /projects/:pid/characters/:id          →  Character
PUT    /projects/:pid/characters/:id          →  Character
DELETE /projects/:pid/characters/:id          →  soft delete
```

#### Locations, Factions, Timeline, Research, Notes

```
# Mesmo padrão: CRUD aninhado em /projects/:pid/{entity}
GET    /projects/:pid/locations
POST   /projects/:pid/locations
...    (mesmo padrão dos endpoints acima)

GET    /projects/:pid/timeline
POST   /projects/:pid/timeline
...

GET    /projects/:pid/research
POST   /projects/:pid/research
...

GET    /projects/:pid/notes
POST   /projects/:pid/notes
...
```

#### Search

```
GET /search?q=termo&projectId=uuid → Resultados agregados
```

#### Export

```
POST /projects/:pid/export              →  { format: ExportFormat }
GET  /projects/:pid/exports             →  Export[] (histórico)
GET  /exports/:id/download              →  file
```

### 5.3 Estrutura de Resposta Padrão

```typescript
// Sucesso
{
  "data": T,
  "meta?": { "total": number, "page": number }
}

// Erro
{
  "error": {
    "code": string,
    "message": string,
    "details?": object
  }
}
```

---

## 6. Arquitetura do Frontend

### 6.1 Estrutura de Diretórios

```
src/
├── app/
│   ├── layout.tsx              # Layout raiz com providers
│   ├── page.tsx                # Landing / Dashboard
│   └── (auth)/
│       ├── login/page.tsx
│       └── register/page.tsx
├── components/
│   ├── ui/                     # shadcn/ui e design system
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── editor/                 # Editor-related components
│   │   ├── editor.tsx          # Provider/wrapper TipTap
│   │   ├── extensions/        # Extensões customizadas
│   │   ├── floating-toolbar.tsx
│   │   ├── slash-menu.tsx
│   │   └── bubble-menu.tsx
│   ├── sidebar/
│   │   ├── sidebar.tsx
│   │   ├── project-nav.tsx
│   │   └── chapter-tree.tsx
│   ├── project/
│   │   ├── dashboard.tsx
│   │   ├── settings.tsx
│   │   └── export-dialog.tsx
│   └── shared/                 # Componentes compartilhados
│       ├── empty-state.tsx
│       ├── loading-screen.tsx
│       └── error-boundary.tsx
├── hooks/
│   ├── use-editor.ts
│   ├── use-project.ts
│   ├── use-autosave.ts
│   └── use-keyboard.ts
├── stores/
│   ├── editor-store.ts         # Estado do editor
│   ├── project-store.ts        # Estado do projeto atual
│   ├── ui-store.ts             # Sidebar, modais, tema
│   └── auth-store.ts           # Login/usuário
├── services/
│   ├── api-client.ts           # Axios/fetch wrapper
│   ├── auth-service.ts
│   ├── project-service.ts
│   └── sync-service.ts         # Engine de sync offline
├── db/
│   ├── schema.ts               # Schema Dexie/IndexedDB
│   └── repositories/          # Operações locais
├── lib/
│   ├── editor-extensions.ts    # Config de extensões TipTap
│   ├── utils.ts               # Utilitários gerais
│   └── constants.ts
└── types/
    ├── project.ts
    ├── editor.ts
    └── api.ts
```

### 6.2 Árvore de Componentes (Página Principal)

```
<AppShell>
  ├── <TopBar>
  │   ├── <BackButton />
  │   ├── <ChapterTitle />
  │   ├── <SaveIndicator />
  │   ├── <UndoRedoGroup />
  │   ├── <SearchTrigger />
  │   ├── <ExportButton />
  │   ├── <FocusModeToggle />
  │   └── <ThemeToggle />
  │
  ├── <Sidebar collapsible>
  │   ├── <ProjectInfo />
  │   ├── <ChapterTree>          # Drag & drop
  │   │   └── <ChapterItem>
  │   │       └── <SceneItem />
  │   ├── <NavGroup label="Organização">
  │   │   ├── <CharactersLink />
  │   │   ├── <LocationsLink />
  │   │   ├── <TimelineLink />
  │   │   └── <ResearchLink />
  │   ├── <NavGroup label="Ferramentas">
  │   │   ├── <NotesLink />
  │   │   ├── <FilesLink />
  │   │   └── <TrashLink />
  │   └── <ProjectSettings />
  │
  ├── <EditorArea>
  │   ├── <Editor />             # TipTap instance
  │   │   ├── <BubbleMenu />
  │   │   ├── <SlashMenu />
  │   │   └── <FloatingToolbar />
  │   └── <FocusOverlay />       # Modo foco: fade lateral
  │
  └── <RightPanel collapsible>
      ├── <Outline />
      ├── <Statistics />
      └── <Comments />
</AppShell>
```

### 6.3 Gerenciamento de Estado

```
┌─────────────────────────────────────────────────┐
│                   Stores (Zustand)                │
├────────────┬──────────┬──────────┬───────────────┤
│ EditorStore │ Project  │ UIStore  │ AuthStore     │
│             │ Store    │          │               │
│ content     │ current  │ sidebar  │ user          │
│ selection   │ projects │ theme    │ token         │
│ history     │ chapters │ panel    │ isOnline      │
│ focusMode   │ scenes   │ modals   │               │
└──────┬──────┴────┬─────┴────┬────┴───────┬───────┘
       │            │          │            │
       └────────────┴──────────┴────────────┘
                      │
              ┌───────┴───────┐
              │  Persist Layer │
              │  (Zustand      │
              │   middleware)  │
              └───────────────┘
```

**Regras do Estado Global:**
- **EditorStore**: conteúdo da cena ativa, histórico de undo/redo, seleção, modo foco — volátil (recarregado da cena ao abrir)
- **ProjectStore**: projeto ativo, lista de capítulos, cenas, entidades — cacheado no IndexedDB
- **UIStore**: sidebar visível/recolhida, painel direito, tema ativo, modais — persistido via `localStorage`
- **AuthStore**: sessão do usuário, token JWT — persistido via `localStorage`

### 6.4 Roteamento

```typescript
// Definição de Rotas
const routes = {
  '/':                          // Dashboard / Landing
  '/login':                     // Login
  '/register':                  // Registro

  '/projects':                  // Lista de projetos
  '/projects/new':              // Criar projeto
  '/projects/:id':              // Dashboard do projeto
  '/projects/:id/settings':     // Configurações do projeto

  '/projects/:id/write':        // Editor principal
  '/projects/:id/write/:chapterId'
  '/projects/:id/write/:chapterId/:sceneId'

  '/projects/:id/characters':           // Lista de personagens
  '/projects/:id/characters/:charId'     // Personagem detalhe
  '/projects/:id/locations':             // Locais
  '/projects/:id/timeline':              // Timeline
  '/projects/:id/research':              // Pesquisas
  '/projects/:id/notes':                 // Notas
  '/projects/:id/files':                 // Arquivos
  '/projects/:id/trash':                 // Lixeira
  '/projects/:id/export':                // Exportar
}
```

---

## 7. Design System & Temas

### 7.1 Direção Visual

O Azoth segue uma direção visual **escura, limpa e arquitetural** — não usa sombras, não usa vidro fosco, não usa gradientes decorativos. A hierarquia é construída com:
- **Tipografia** como elemento estrutural primário
- **Escala de cinzas** para diferenciar superfícies (nunca sombras)
- **Acento cromático único** e raro (Amber Whisper ou equivalente)
- **Espaçamento generoso** e layout galeria

> **Nota de alinhamento:** A seção de "Design System" da v1.0 do SDD mencionava glassmorphism, blur e cards elevados. A direção revisada elimina esses elementos em favor de uma estética plana, monocromática e tipográfica — consistente com o DESIGN.md do Hyperstudio e com as preferências do produto.

### 7.2 Temas

| Tema | Canvas | Superfície | Texto | Acento | Status |
|------|--------|-----------|-------|--------|--------|
| Midnight | `#101010` | `#212121` | `#f3f3f3` | `#e7c59a` | MVP |
| Obsidian | `#1a1a1a` | `#2a2a2a` | `#e8e8e8` | `#7eb8da` | MVP |
| Nord | `#2e3440` | `#3b4252` | `#eceff4` | `#88c0d0` | V1 |
| Dracula | `#282a36` | `#44475a` | `#f8f8f2` | `#bd93f9` | V1 |
| AMOLED | `#000000` | `#0d0d0d` | `#f3f3f3` | `#e7c59a` | V2 |

### 7.3 Componentes Base

Todos os componentes do design system seguem estas regras:
- **Border radius:** 8px (botões, inputs, badges), 20px (cards/containers), 99px (apenas pill CTAs)
- **Bordas:** 1px solid, usando `--color-onyx-edge: #212121`
- **Superfícies:** diferenciadas por tom de cinza, nunca por sombra
- **Elevação:** 4 níveis de cinza, 0 níveis de shadow
- **Ícones:** Lucide, line style, 1.5px stroke, monocromáticos branco/cinza
- **Animações:** sutis, apenas transform/opacity, `prefers-reduced-motion` respeitado

---

## 8. Funcionalidades por Prioridade

### MVP (v1.0)

| Área | Funcionalidade | Depende de |
|------|---------------|------------|
| Projeto | Criar, listar, editar, deletar projeto | — |
| Projeto | Layout dashboard com projetos recentes | — |
| Editor | Editor rich text com TipTap (bold, italic, headings, lists, quotes) | Projeto |
| Editor | Salvamento automático (autosave local) | Editor |
| Escrita | Estrutura Livro → Capítulo → Cena | Projeto |
| Escrita | Drag & drop para reordenar capítulos/cenas | Escrita |
| Organização | Personagens (CRUD básico) | Projeto |
| Organização | Locais (CRUD básico) | Projeto |
| Organização | Notas (CRUD básico) | Projeto |
| UI | Tema Midnight (escuro padrão) | — |
| UI | Sidebar recolhível | — |
| UI | Barra superior com undo/redo | Editor |
| Dados | Persistência local (IndexedDB) | — |
| Dados | Contador de palavras | Editor |
| Exportação | Exportar para TXT | Escrita |
| Exportação | Exportar para Markdown | Escrita |

### V1.1

| Funcionalidade |
|---------------|
| Login/Logout tradicional (email + senha) |
| Sincronização básica (um dispositivo → servidor) |
| Tema Obsidian |
| Exportar para DOCX |
| Timeline visual |
| Tags em cenas, personagens, locais |
| Lixeira com recuperação |

### V2.0

| Funcionalidade |
|---------------|
| Login social (Google, GitHub, Microsoft) |
| Factions (facções/grupos) |
| Metas diárias de escrita |
| Estatísticas (gráficos de palavras/dia) |
| Temas Nord e Dracula |
| Busca global |
| Favoritos / fixar documentos |
| Histórico de versões |
| Comentários privados |
| Modo foco |

### V3.0+

| Funcionalidade |
|---------------|
| Exportar EPUB e PDF |
| Tema AMOLED |
| Colaboração em tempo real |
| Aplicativo desktop (Tauri) |
| IA para sugestões e revisão |
| Sistema de plugins |
| Modo offline completo com sync engine |
| Versionamento estilo Git para escrita |
| Worldbuilding visual (mapas mentais) |

---

## 9. Editor de Texto

### 9.1 Arquitetura TipTap

```
<EditorProvider>
  ├── <Editor>
  │   ├── Node Schemas: doc, paragraph, heading, bulletList, orderedList,
  │   │                  listItem, image, blockquote, codeBlock, horizontalRule,
  │   │                  hardBreak, text, sceneBreak (custom)
  │   │
  │   ├── Marks: bold, italic, underline, strike, highlight, code, link
  │   │
  │   └── Extensions: Placeholder, Typography, TextAlign, TextStyle, Color,
  │                    SlashMenu (custom), BubbleMenu (custom),
  │                    DragHandle (custom), WordCount
  │
  ├── <BubbleMenu />          # Aparece ao selecionar texto
  ├── <SlashMenu />           # Abre com / para comandos
  └── <FloatingToolbar />     # Barra de formatação contextual
```

### 9.2 Formatos de Edição

| Modo | Descrição | Mecanismo | Prioridade |
|------|-----------|-----------|------------|
| **Rich Text** | WYSIWYG completo | ProseMirror JSON | MVP |
| **Markdown** | Escrita em markdown com preview | Conversor MD → ProseMirror | V2 |
| **TXT** | Texto puro sem formatação | Textarea simples | MVP (export) |

### 9.3 Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Ctrl+Shift+S` | Strike |
| `Ctrl+Shift+1-6` | Heading 1-6 |
| `Ctrl+Shift+7` | Paragraph |
| `Ctrl+Shift+8` | Bullet List |
| `Ctrl+Shift+9` | Ordered List |
| `Ctrl+K` | Inserir link |
| `Ctrl+Shift+C` | Toggle checklist |
| `Ctrl+Shift+E` | Quote |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / Redo |
| `Ctrl+S` | Salvar (autosave já cobre) |
| `Ctrl+P` | Busca global |
| `Ctrl+Shift+F` | Modo foco |
| `Ctrl+Shift+D` | Abrir comando palette |

### 9.4 Salvamento

```
Evento de escrita
      │
      ▼
┌─────────────────┐
│  Debounce 1.5s   │
└────────┬────────┘
         │
         ▼
┌────────────────┐
│  Salvar local   │
│  (IndexedDB)    │
└────────┬────────┘
         │
         ▼
┌────────────────┐
│  Notificar UI   │
│  ("Salvo")      │
└────────────────┘
         │
         ▼
┌────────────────┐     Online?     ┌────────────────┐
│  Enqueue sync   │───────────────│  Replicar API   │
│  (fila local)   │    Não         │  (background)   │
└────────────────┘                └────────────────┘
```

---

## 10. Fluxos de Navegação

### 10.1 Dashboard → Escrita

```
[Dashboard]
    │
    ├── "Continuar escrevendo" ────────────────┐
    │                                           │
    ├── Clicar em projeto                       │
    │           │                               │
    │           ▼                               │
    │   [Project Dashboard]                     │
    │           │                               │
    │           ├── "Novo Capítulo" ──┐          │
    │           │                     │          │
    │           └── Clicar capítulo   │          │
    │                       │         │          │
    └───────────────────────┴─────────┴──────────┘
                              │
                              ▼
                     [Editor /write]
```

### 10.2 Ciclo de Vida de um Projeto

```
[Criar Projeto] → [Dashboard Projeto] → [Escrever] → [Organizar] → [Exportar]
     │                                                              │
     └────────────────── [Lixeira] ←── [Deletar] ←──────────────────┘
```

### 10.3 Layout States

| State | Aparência |
|-------|-----------|
| **Empty** (sem projetos) | CTA grande centralizado: "Crie seu primeiro projeto" com ilustração sutil |
| **Loading** | Skeleton screens: linhas pulsantes simulando estrutura de sidebar + editor |
| **Error** | Mensagem clara + botão "Tentar novamente", sem perder dados locais |
| **Editor vazio** | Placeholder TipTap: "Comece a escrever..." com fade suave ao digitar |
| **Offline** | Indicador sutil no topo + toast na primeira ação offline |
| **404 projeto** | "Projeto não encontrado" + link de volta ao dashboard |

---

## 11. Segurança & Dados

### 11.1 Autenticação

- JWT com refresh token (access: 15min, refresh: 7d)
- Senhas hasheadas com bcrypt (cost factor 12)
- Rate limiting em endpoints de login (5 tentativas / minuto)
- CSRF protection via cookies (não apenas localStorage)

### 11.2 Dados do Usuário

- Sem login: dados residem apenas no IndexedDB do navegador
- Com login: dados replicados para PostgreSQL com criptografia em trânsito (TLS 1.3)
- Exportações: arquivos gerados sob demanda, deletados após 24h
- Lixeira: purge automático após 30 dias

### 11.3 Privacidade

- Sem telemetria na v1
- Sem analytics que saiam do controle do usuário
- Dados de escrita nunca usados para treinamento de modelos

---

## 12. Performance

### 12.1 Editor

- TipTap com lazy loading de extensões não essenciais
- Debounce de 1.5s no autosave (não salvar a cada caractere)
- Documentos grandes: virtualização de nós ProseMirror (futuro)
- Histório de undo limitado a 100 passos para evitar vazamento de memória

### 12.2 Renderização

- React.memo em componentes de árvore (chapter-tree, sidebar)
- Listas de personagens/locais com virtual scrolling (`react-window` ou `@tanstack/virtual`)
- Lazy loading de rotas com `React.lazy` + `Suspense`
- Imagens de personagem otimizadas com lazy loading nativo

### 12.3 Alvos

| Métrica | Alvo |
|---------|------|
| Time to Interactive | < 3s (first load) |
| Editor mount | < 500ms |
| Autosave | < 50ms (nunca bloquear input) |
| Search local | < 200ms |
| Export (DOCX 100k palavras) | < 5s |
| Tamanho bundle (gzip) | < 150kb inicial |

---

## 13. Futuro — Pontos de Extensão

A arquitetura prevê estes ganchos para evolução sem refatoração:

| Funcionalidade | Gancho de Extensão | Mecanismo |
|---------------|-------------------|-----------|
| IA / Geração de texto | Slot no editor + provedor de prompt | Plugin API (V2) |
| Chat contextual com IA | Painel direito extensível | Painel registry |
| Sugestões de estilo | Hook no autosave para análise assíncrona | Event emitter |
| Corretor gramatical | Serviço de texto plugável | Interface `ITextProcessor` |
| Colaboração real-time | OT/CRDT sobre a estrutura de cena | WebSocket + Yjs |
| Versionamento | Snapshot do documento + diff | Snapshot store |
| Sincronização offline | Sync engine com merge LWW | Fila de operações |
| Marketplace de templates | Template registry + importador | JSON Schema |
| Plugins | Sandbox + API declarativa | Iframe + postMessage |
| Desktop (Tauri) | Mesmo frontend, shell nativo | Tauri wrapper |
| App mobile | API compartilhada + PWA primeiro | Service Worker |

---

## Apêndice A — Glossário

| Termo | Definição |
|-------|-----------|
| **Cena** | Unidade atômica de conteúdo textual. Uma cena equivale a um trecho contínuo de escrita dentro de um capítulo |
| **Capítulo** | Agrupamento de cenas. Corresponde a um capítulo do livro |
| **Projeto** | Contêiner máximo. Um livro, uma série de contos, um mundo de RPG |
| **ProseMirror JSON** | Formato de árvore de nós que representa o documento rich text |
| **Offline-first** | Estratégia onde o dispositivo local é a fonte da verdade; o servidor é réplica |
| **LWW** | Last-Write-Wins: estratégia de resolução de conflitos onde a última escrita vence |
| **Sync Engine** | Mecanismo que reconcilia dados locais com o servidor quando a conexão é restabelecida |

## Apêndice B — Decisões de Arquitetura (ADRs)

### ADR-001: Índice de Dados Local

**Contexto:** Precisamos armazenar dados localmente para operação offline.
**Decisão:** Usar IndexedDB via Dexie.js.
**Consequências:** Suporte nativo a queries indexadas, índices compostos, transações. Não depende de WASM. Fácil migração de schema.
**Status:** Aceito.

### ADR-002: Formato do Documento

**Contexto:** O editor precisa de um formato rico e extensível.
**Decisão:** ProseMirror JSON (não markdown) como formato nativo de armazenamento.
**Consequências:** Permite nós customizados (scene break, character reference), extensões síncronas, serialização fiel. Markdown como formato de exportação apenas.
**Status:** Aceito.

### ADR-003: Monorepo vs Repositórios Separados

**Contexto:** Frontend e backend precisam de controle de versão.
**Decisão:** Monorepo com diretórios `/client` e `/server`.
**Consequências:** CI/CD compartilhado, tipos compartilhados, PRs atômicas (mudanças full-stack em um PR).
**Status:** Proposto — confirmar na implementação.

### ADR-004: Sem Login na v1

**Contexto:** O SDD menciona "uso sem login" como cenário primário.
**Decisão:** A v1 funciona 100% offline, sem backend obrigatório. Login + backend são adicionais na v1.1.
**Consequências:** MVP mais rápido, sem infraestrutura de servidor. Arquitetura de API já definida para quando o backend for adicionado.
**Status:** Aceito.
