# Entity relationship overview

`backend/app/db/models.py` is authoritative. The current high-level relationships are:

```mermaid
erDiagram
  PATIENT_DATA ||--o{ DIALYSIS_SESSIONS : has
  PATIENT_DATA ||--o{ PATIENT_MEDICATIONS : has
  PATIENT_DATA ||--o{ LAB_INVESTIGATIONS : has
  PATIENT_DATA ||--o{ ANALYSIS : has
  PATIENT_DATA ||--o{ CULTURES : has
  PATIENT_DATA ||--o{ DRY_WEIGHT : has
  PATIENT_DATA ||--o{ HD_SCHEDULE : has
  PATIENT_DATA ||--o{ HD_SESSIONS : has
  PATIENT_DATA ||--o{ VIRAL_SEROLOGY : has
  PATIENT_DATA ||--o{ ANTICOAGULATION : has
  PATIENT_DATA ||--o{ IV_ACCESS : has
  DIALYSIS_SESSIONS ||--o{ SESSION_MEDICATIONS : contains
  DIALYSIS_SESSIONS ||--o{ SESSION_SIGNATURES : contains
  USERS ||--o{ AUDIT_LOG : produces
```

Patient and session child relationships use cascading deletion. Audit records retain a nullable user reference when a user is removed.
