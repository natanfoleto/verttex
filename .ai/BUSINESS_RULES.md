# Business Rules — Verttex

This document tracks the product guidelines, business rules, and constraints for the Verttex platform.

## 1. Product Slogan & Purpose

> Na Verttex, conectamos você ao melhor dos cantos onde a internet não alcança, com produtos artesanais que carregam histórias e sabores únicos.

Verttex aims to bridge the gap between regional/artisanal producers and online consumers/companies.

## 2. In-Scope (Future Development)

- Artisanal and regional products cataloging.
- Multi-tenant manager dashboards for producers.
- Marketplace shopping cart, orders, and payment integrations.
- Postgres-based domain entities.

## 3. Strict Rules & Constraints (For AI Agents)

- **DO NOT INVENT** any business rules, models, or tables (like `Product`, `Order`, `Producer`, `Customer`, etc.) during this bootstrap phase.
- Keep database structures completely empty except for configuration details.
- Do not define roles or permissions other than placeholder tech roles (e.g. `ADMIN` and `USER`).
- Mock domain data is strictly forbidden in code to avoid design confusion.
