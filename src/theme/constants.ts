export const SAMPLE_MERMAID_DIAGRAM = `graph TD
    A[Start: User Request] --> B{Check<br/>Authentication}
    B -->|Authenticated| C[Load Diagram]
    B -->|Not Auth| D[Show Login]
    C --> E[Render Canvas]
    E --> F{User<br/>Action}
    F -->|Edit| G[Update Diagram]
    F -->|Export| H[Download File]
    F -->|Share| I[Generate Link]
    G --> E
    H --> J[End]
    I --> J
    D --> J`;
