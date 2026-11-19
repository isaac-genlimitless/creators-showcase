# Security Policy

## Overview

Creators Showcase is a **sanitized public sample** of a K-12 microschool marketplace. It demonstrates architecture, conventions, authentication patterns, and data-modeling practices. It is **not** a production system and does not process real user data, payments, or child information.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| main    | Yes       |

Only the latest commit on `main` is considered supported for security reports.

## Reporting a Vulnerability

If you discover a security issue in this repository (for example, a flaw in the demonstrated authentication patterns, a potential data-exposure risk in the schema design, or a problem in the provider adapters), please report it privately.

**Preferred method:** Open a private security advisory on this GitHub repository  
(Security → Advisories → Report a vulnerability).

Alternatively, you may email the maintainer directly. Please include:

- A clear description of the issue
- Steps to reproduce (if applicable)
- Any relevant code paths or files
- Your assessment of impact and severity

**Do not** open a public GitHub issue for security vulnerabilities.

## What to Expect

- Acknowledgment of your report within a reasonable timeframe
- A discussion of whether the issue applies to the showcase code as written
- Credit in the advisory (if you wish) once resolved

Because this is a demonstration repository rather than a live service, most reports will result in documentation or code updates rather than emergency patches.

## Scope

In scope:
- Authentication and session-handling patterns shown in `src/lib/auth.ts`
- Data-modeling choices that could lead to unintended exposure (e.g., private vs public fields)
- Provider adapter implementations
- Any hardcoded credentials or secrets that may have been missed during sanitization

Out of scope:
- The original private `creation-system` repository (this is a separate, sanitized copy)
- Infrastructure or deployment details that were intentionally removed
- Issues that require the full original feature set to reproduce
- General best-practice suggestions that do not represent a concrete vulnerability

## Child Safety & COPPA

The design explicitly avoids storing email, phone, photo, or location data for children. Any change that would weaken those constraints should be treated as a security-relevant issue and reported as above.

## Secrets

This repository should contain **no real secrets**. The `.env.example` file uses only placeholders. If you find an actual credential, token, or production hostname, please report it immediately so it can be removed.

## Thank You

Responsible disclosure helps keep both this sample and the patterns it demonstrates safer for anyone learning from or building on the code.
