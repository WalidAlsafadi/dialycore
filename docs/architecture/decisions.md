# Architecture decisions

## SQLAlchemy is the schema source of truth

The current relational model lives in `backend/app/db/models.py`. Development tables are created from metadata. A production adaptation should add reviewed migrations rather than maintaining parallel handwritten DDL.

## SQLite is the demonstration default

SQLite keeps local setup and deterministic demos simple. Database files are runtime artifacts and are never distributed or committed. Other database engines require explicit compatibility and migration work.

## Synthetic data is generated, never sampled

`backend/generate_demo_data.py` independently authors the complete demo environment from generic pools and templates. No importer or exporter from a clinical source is part of the public workflow.

## JWT authentication with three roles

The model recognizes `admin`, `doctor`, `nurse`, and a read-only `guest`. User-management endpoints enforce administrator access. Guest tokens are rejected by every mutation route. Fine-grained authorization among staff roles remains deployment work and must be reviewed locally.

## Clinical limitations are explicit

Session signatures are recorded, but the current model does not implement a complete dual-signature lock/amendment state machine. DialyCore must not claim controls that are not enforced in code.
