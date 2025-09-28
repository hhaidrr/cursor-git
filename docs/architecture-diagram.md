# Architecture Diagram

## Heuristic Logic Flow

```mermaid
graph TD
    A[Text Change Detected] --> B{Is User Action?}
    B -->|Yes| C[Flag as Human]
    B -->|No| D[Start/Continue Session]
    
    C --> E[Skip Commit]
    
    D --> F{Enough Characters?}
    F -->|No| G[Continue Session]
    F -->|Yes| H[Calculate WPM]
    
    H --> I{WPM > Threshold?}
    I -->|Yes| J[Flag as AI]
    I -->|No| K[Flag as Human]
    
    G --> L[File Save Event]
    J --> L
    K --> L
    
    L --> M{Flag = AI?}
    M -->|Yes| N[Auto-Commit]
    M -->|No| O[Skip Commit]
    
    N --> P[Show Notification]
    O --> Q[Log Decision]
```

## Component Overview

```mermaid
graph LR
    A[ChangeDetector] --> B[Typing Speed Analysis]
    A --> C[User Action Detection]
    A --> D[Session Management]
    A --> E[File Save Handler]
    
    B --> F[WPM Calculation]
    C --> G[Delete/Undo Detection]
    D --> H[Session Timeout]
    E --> I[Commit Decision]
    
    F --> J[AI/Human Flag]
    G --> J
    H --> J
    J --> I
```

## Data Flow

```mermaid
sequenceDiagram
    participant U as User/AI
    participant E as Extension
    participant S as Session Manager
    participant G as Git Manager
    
    U->>E: Text Change
    E->>S: Analyze Speed
    S->>S: Calculate WPM
    S->>E: Return Flag (AI/Human)
    
    U->>E: File Save
    E->>E: Check Flag
    alt Flag = AI
        E->>G: Stage & Commit
        G->>E: Success
        E->>U: Show Notification
    else Flag = Human
        E->>E: Skip Commit
    end
```

## Configuration Impact

```mermaid
graph TD
    A[Configuration] --> B[Typing Speed Threshold]
    A --> C[Session Timeout]
    A --> D[Min Characters]
    A --> E[Commit Frequency]
    
    B --> F[AI Detection Sensitivity]
    C --> G[Session Grouping]
    D --> H[Analysis Reliability]
    E --> I[Commit Timing]
    
    F --> J[Final Decision]
    G --> J
    H --> J
    I --> J
```

## Key Classes

- **ChangeDetector**: Main heuristic logic controller
- **GitManager**: Handles git operations and commit messages
- **SessionManager**: Manages typing sessions and WPM calculation
- **UserActionDetector**: Identifies human-only actions

## State Management

- **isHumanTyping**: Boolean flag for current typing mode
- **currentSession**: Active typing session data
- **typingSessions**: History of recent sessions
- **pendingChanges**: File-specific change tracking

---

*This diagram shows the high-level architecture and data flow of the heuristic detection system.*

