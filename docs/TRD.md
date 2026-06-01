# Atmos — Technical Requirements Document (TRD)

**Version:** 1.0  
**Date:** June 1, 2026  
**Status:** Active Development  
**Technical Lead:** Engineering Team

---

## Executive Summary

This document defines the technical architecture, system design, API specifications, database schema, and implementation details for the Atmos carbon credit platform. It serves as the single source of truth for engineering decisions and technical constraints.

**Technology Stack:**
- **Backend:** Node.js 18, TypeScript 5.9, Express.js 5
- **Frontend:** React Native (Expo 55), React 19
- **Database:** PostgreSQL 15 (Drizzle ORM)
- **Blockchain:** Solana (devnet → mainnet)
- **AI:** Anthropic Claude Haiku 4.5
- **Payments:** Dodo Payments API
- **Privacy:** Umbra SDK (Solana confidential transfers)
- **Hosting:** Vercel (serverless functions)
- **Monitoring:** Pino (structured logging)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Mobile App (React Native + Expo)                               │
│  - Project capture + camera                                      │
│  - Wallet integration (Phantom/Solflare)                        │
│  - Payment checkout (WebBrowser)                                │
│  - Offline queue (AsyncStorage)                                 │
└──────────────────┬──────────────────────────────────────────────┘
                   │ HTTPS / REST API
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  API Server (Express.js)                                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Routes                                                       ││
│  │ ├── /api/healthz          Health check                      ││
│  │ ├── /api/verify           AI verification                   ││
│  │ ├── /api/verify/evidence  Image analysis                    ││
│  │ ├── /api/assets/mint      SPL token minting                 ││
│  │ ├── /api/proofs/anchor    ZK proof anchoring                ││
│  │ ├── /api/payments/dodo/*  Payment checkout + webhooks       ││
│  │ ├── /api/portfolio        Encrypted portfolio (Umbra)       ││
│  │ └── /api/solana/payer     Debug endpoint                    ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Services                                                     ││
│  │ ├── Solana Service        SPL minting, proof anchoring      ││
│  │ ├── Verification Engine   Multi-agent LLM orchestration     ││
│  │ ├── Satellite Adapter     Google Static Maps integration    ││
│  │ ├── Umbra Service         Private transfers + viewing keys  ││
│  │ ├── Auth Service          JWT generation + validation       ││
│  │ └── Metadata Builder      Metaplex token metadata           ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────┬──────────────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┬─────────────┬────────────────┐
    ↓              ↓              ↓             ↓                ↓
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│PostgreSQL│  │  Redis   │  │  Solana  │  │Anthropic │  │   Dodo   │
│  + GIS   │  │ (cache)  │  │ Devnet   │  │   API    │  │Payments  │
│ Drizzle  │  │          │  │SPL Tokens│  │  Claude  │  │  + Svix  │
└─────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```


### Component Diagram

```
Mobile App                API Server                  External Services
──────────                ──────────                  ─────────────────
┌──────────┐             ┌──────────┐
│ Project  │────────────>│ Verify   │───────────────>│ Anthropic API │
│ Capture  │             │ Route    │                │ Claude Haiku  │
└──────────┘             └────┬─────┘                └───────────────┘
                              │
                              ├──────────────────────>│ Google Maps   │
                              │                       │ Static API    │
                              ↓                       └───────────────┘
┌──────────┐             ┌──────────┐
│ Mint     │────────────>│ Solana   │───────────────>│ Solana RPC    │
│ Asset    │             │ Service  │                │ Devnet/Mainnet│
└──────────┘             └──────────┘                └───────────────┘
                              │
                              ↓
┌──────────┐             ┌──────────┐
│ Payment  │────────────>│ Payments │───────────────>│ Dodo API      │
│ Checkout │             │ Route    │<───────────────│ Svix Webhooks │
└──────────┘             └──────────┘                └───────────────┘
                              │
                              ↓
┌──────────┐             ┌──────────┐
│ Portfolio│────────────>│ Umbra    │───────────────>│ Umbra Program │
│ View     │             │ Service  │                │ (Solana)      │
└──────────┘             └──────────┘                └───────────────┘
                              │
                              ↓
                         ┌──────────┐
                         │PostgreSQL│
                         │ Database │
                         └──────────┘
```

---

## API Specification

### Base URL
- **Development:** `http://localhost:9001/api`
- **Staging:** `https://staging-api.atmos.protocol/api`
- **Production:** `https://api.atmos.protocol/api`

### Authentication
All protected routes require JWT Bearer token:
```
Authorization: Bearer <jwt_token>
```

### Common Response Format
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-06-01T12:00:00Z"
}
```

