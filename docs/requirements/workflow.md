# Workflow overview

## Patient registry

Create and maintain Arabic patient identity fields, clearly separated internal file numbers, demographic details, location, blood group, and status. The public demo uses visibly fictional `DEMO-*` identifiers and non-dialable placeholders.

## Dialysis program

Record recurring day/period/room schedules, doctor orders, dry-weight history, anticoagulation, and vascular access. The dashboard and schedule views aggregate these records.

## Treatment session

Record timing, access, anticoagulant, pre/post weights and blood pressure, target weight, ultrafiltration rate, blood flow, venous pressure, TMP, selected therapies, rare transfusion details, structured administrations, generic notes, and nurse signatures.

## Longitudinal clinical data

Maintain medication orders, laboratory investigations, viral serology, analyses, and cultures. Patient detail tabs expose history across these resources.

The current signature model records attribution but does not lock a session or create amendments. Any such workflow must be designed, implemented, and validated before deployment.
