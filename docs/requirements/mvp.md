# Current public scope

The requirements in this directory translate input from professionals familiar with hemodialysis-unit operations into an institution-neutral software reference. They are domain-informed, not a substitute for local protocols or clinical validation.

DialyCore demonstrates institution-neutral dialysis-unit record workflows. It supports Arabic patient data, patient status, schedules, session observations and parameters, medication records, doctor orders, labs, serology, analyses, cultures, dry-weight history, vascular access, signatures, users, audit events, dashboards, and statistics.

The public reference implementation uses generated demonstration data and does not replace an organization's clinical record, governance, or medical-device processes. It does not currently implement a complete signed-record lock and amendment workflow.

The supported roles are administrator, doctor, and nurse. Fine-grained API authorization beyond administrator-only user management remains deployment work and must not be inferred from hidden UI controls.
