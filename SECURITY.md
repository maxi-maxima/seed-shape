# Security Policy

## Supported Versions

`seed-shape` is pre-1.0. Security fixes target the latest published minor version.

## Reporting a Vulnerability

Please open a private security advisory on GitHub when possible. If that is not available, open an issue with a minimal description and avoid posting exploitable payloads publicly.

## Scope

`seed-shape` is designed to run locally and does not connect to databases or external services. Security-sensitive areas include:

- file path handling;
- generated SQL escaping;
- parser denial-of-service cases;
- accidental inclusion of secrets in fixtures.

Do not put real credentials, production records, or private customer data into schema examples or generated fixtures.
