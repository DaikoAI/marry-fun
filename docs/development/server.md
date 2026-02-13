# Server Architecture

## Overview

The server follows **Clean Architecture / Hexagonal Architecture (Ports & Adapters)** with DDD and SOLID principles. The core idea: domain logic is isolated from frameworks and infrastructure. Outer layers depend on inner layers through abstractions (ports), never the reverse.

## Layer Diagram

```
┌─────────────────────────────────────────────┐
│  Interface Layer (API routes, schemas)       │
│  ┌─────────────────────────────────────────┐ │
│  │  UseCase Layer (application services)   │ │
│  │  ┌─────────────────────────────────────┐│ │
│  │  │  Domain Layer (entities, values,    ││ │
│  │  │  ports, errors)                     ││ │
│  │  └─────────────────────────────────────┘│ │
│  └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  Infrastructure Layer (adapters, repos, DI)  │
└─────────────────────────────────────────────┘
```

**Dependency direction**: Interface → UseCase → Domain ← Infrastructure

Infrastructure implements domain ports but never leaks into use cases.

## Layer Rules

### Domain (`src/domain/`)

The innermost layer. Pure business logic with zero framework dependencies.

- **Entities**: Aggregates with business behavior (e.g., `GameSession`)
- **Value Objects**: Immutable, self-validating types (e.g., `Score`, `NgWord`, `CharacterType`, `Emotion`, `Locale`)
- **Ports**: Interfaces that define contracts for external dependencies
  - Repository ports (e.g., `GameSessionRepository`) — persistence abstraction
  - Adapter ports (e.g., `AiChatAdapter`) — external service abstraction
- **Errors**: Domain-specific exceptions with `code` and `statusCode`

Rules:

- No imports from any other layer
- No framework-specific code
- Value objects validate on construction and are immutable
- Entities encapsulate business rules as methods

### UseCase (`src/usecase/`)

Application services that orchestrate domain logic.

- Depends only on domain ports (injected via constructor)
- Coordinates entities, value objects, and port calls
- Contains no business rules — delegates to domain
- Contains no HTTP/framework concerns — that belongs to interface layer

### Interface (`src/interfaces/`)

Translates external requests into domain operations and domain results back into responses.

- **Schemas**: Request/response validation with Zod (discriminated unions)
- **Handlers**: Map validated requests to use case calls, transform results to responses
- **Error handlers**: Convert domain errors to HTTP status codes

Rules:

- Owns all request/response shapes and validation
- Never contains business logic
- Never calls infrastructure directly — always goes through use cases

### Infrastructure (`src/infrastructure/`)

Concrete implementations of domain ports and application wiring.

- **Adapters**: Implement domain adapter ports (e.g., AI service client)
- **Repositories**: Implement domain repository ports
- **Container**: Manual dependency injection wiring
- **Prompts**: System prompt source management

Rules:

- Implements domain ports — the domain defines the interface, infrastructure fulfills it
- Use cases never know which implementation they're using
- Swapping implementations (e.g., storage backend) requires no changes above this layer

## Data Flow

```
POST /api/chat
  → Route handler (app/api/chat/route.ts)
    → Schema validation (Zod)
      → Handler (interfaces/api/)
        → UseCase (usecase/)
          → Domain entities + ports
          → Infrastructure adapters (via injected ports)
        ← Result
      ← Response transformation
    ← Response validation
  ← NextResponse.json()
```

## Adding New Features

### New external service

1. Define a **port** (interface) in `src/domain/adapter/`
2. Implement the **adapter** in `src/infrastructure/adapter/`
3. Wire it in `src/infrastructure/container.ts`
4. Inject into the relevant use case via constructor

### New domain concept

1. Create **value object** or **entity** in `src/domain/`
2. Add validation and business behavior as methods
3. Use from use case layer

### New API endpoint

1. Define **request/response schemas** in `src/interfaces/schemas/`
2. Create **handler** in `src/interfaces/api/`
3. Create or update **use case** in `src/usecase/`
4. Add **route** in `src/app/api/`

## System Prompts

Character personality definitions and AI instructions live in `openclaw/*.md` as the source of truth. These are synced to code via:

```bash
bun run sync:soul
```

Never edit `src/lib/soul-prompt.generated.ts` directly — edit the source markdown files instead.

## Testing

- **Unit tests**: Domain layer (entities, value objects, business rules)
- **Integration tests**: API routes with mocked infrastructure (adapter/repository ports)
- Mock at the port boundary — use cases are tested through their ports, not through concrete implementations

## Key Files

| Layer     | Path                           | Purpose                                  |
| --------- | ------------------------------ | ---------------------------------------- |
| Domain    | `domain/entities/`             | Aggregates with business behavior        |
| Domain    | `domain/values/`               | Immutable, self-validating value objects |
| Domain    | `domain/repositories/`         | Repository port interfaces               |
| Domain    | `domain/adapter/`              | External service port interfaces         |
| Domain    | `domain/errors/`               | Domain-specific exceptions               |
| UseCase   | `usecase/`                     | Application service orchestration        |
| Interface | `interfaces/schemas/`          | Zod request/response validation          |
| Interface | `interfaces/api/`              | Request handlers                         |
| Interface | `interfaces/errors/`           | Error-to-HTTP mapping                    |
| Infra     | `infrastructure/adapter/`      | External service implementations         |
| Infra     | `infrastructure/repositories/` | Persistence implementations              |
| Infra     | `infrastructure/container.ts`  | Dependency injection wiring              |
| API       | `app/api/`                     | Next.js route handlers                   |
