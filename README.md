# YouTrack Test Management App

## Overview

This YouTrack app provides a **global toggle panel** and an overview of all active projects within a YouTrack instance.
It serves as a lightweight administrative dashboard that allows authorized users to enable or disable a global flag (for example, to toggle a testing mode or feature rollout), with the change persisted and synchronized across all clients.

The app is built using **JetBrains Ring UI** components, ensuring a consistent native look and seamless integration with YouTrack’s APIs and storage system.

---

## Features

- **Global Toggle Switch:** Enables or disables a shared boolean flag stored in global app storage.

- **Real-Time Conflict Handling:** Uses a **version-based optimistic concurrency control (OCC)** mechanism to ensure consistent updates across clients.

- **Project Overview:** Displays all active projects with key metadata (name, key, description, and project lead).

- **Persistent State:** The toggle state and metadata (version, timestamp, client ID) are persisted in global storage and reloaded across sessions.

---

## Sync & Conflict Resolution Design

### Chosen Mechanism: Version-Based Optimistic Concurrency Control (OCC)

Each toggle update carries:
- `toggle` — the desired new boolean value
- `expectedVersion` — the version number the client believes is current
- `clientId` — a unique identifier for the client making the change

On the server:
1. The current version from storage is compared with the client’s `expectedVersion`.
2. If they differ, the server rejects the update with a **409 Conflict** response and returns the latest known state.
3. If they match, the update proceeds:
    - The version is incremented (`version + 1`).
    - The change is persisted with a new `timestamp` and `clientId`.

This ensures **deterministic conflict detection** and prevents accidental overwrites caused by race conditions or network lag.

**Key properties:**
- Deterministic (no timestamp collisions)
- Clock-independent (safe under clock skew)
- Clear retry semantics (client can re-sync and retry)
- Minimal overhead (simple integer counter)

---

## Other Considered Mechanisms

### 1. **Last Writer Wins (LWW)** *(previous approach)*
**Description:**  
Each client includes a timestamp in its update. The server accepts the newer one based on time comparison.

**Trade-offs:**
- ✅ Simple to implement
- ❌ Vulnerable to clock skew (different client timezones)
- ❌ Non-deterministic under same-millisecond updates
- ❌ Silent overwrites (no explicit conflict signaling)

**Reason Rejected:**  
LWW could cause nondeterministic overwrites when concurrent updates occurred nearly simultaneously. 
Clients could lose state silently if network delays reordered requests.
Clients could manipulate the clock so their change always wins.

---

### 2. **Server Locking or Mutex-Based Updates**
**Description:**  
Server locks the toggle while one client updates, preventing others from writing.

**Trade-offs:**
- ✅ Prevents concurrent edits completely
- ❌ Adds latency and requires explicit lock management
- ❌ Doesn’t scale for distributed or offline clients

**Reason Rejected:**  
Overkill for a small boolean flag.

---

### 3. **Vector Clocks**
**Description:**  
Each client maintains a logical clock (a counter) per participant, forming a vector of causality relationships.  
When an update is sent, the vector is merged on the server to determine whether one update happened before, after, or concurrently with another.

**Trade-offs:**
- ✅ Fully captures causal relationships (no ambiguity under concurrency)
- ✅ Enables automatic merging of partially concurrent updates
- ❌ Adds per-client clock tracking and vector merging logic
- ❌ Complex to implement for a simple global flag

**Reason Rejected:**  
Vector clocks add unnecessary complexity here.  
For a **single boolean flag**, a single monotonic version counter provides the same conflict detection guarantees with far less overhead.

---

## Why Versioned OCC Was Chosen

|  | LWW | Locking | Vector Clock | **Versioned OCC** |
|------------|-----|----------|---------------|------------------|
| Determinism | ⚠️ Partial | ✅ | ✅ | ✅ |
| Handles clock skew | ❌ | ✅ | ✅ | ✅ |
| Explicit conflict signal | ❌ | ✅ | ✅ | ✅ |
| Complexity | ✅ Simple | ⚠️ Moderate | ❌ High | ✅ Simple |
| Stateless compatibility | ✅ | ❌ | ⚠️ Partial | ✅ |


The **version-based OCC** model provides the ideal balance:
- Simple to reason about
- Deterministic under concurrent updates
- Compatible with YouTrack’s backend constraints
- Scalable if more fields are added later

---

## Tech Stack

- **Frontend:** React + TypeScript + JetBrains Ring UI
- **Backend:** YouTrack App Server API (JavaScript)
- **Storage:** YouTrack Global Storage (key-value store)

---

## Packaging

The app is bundled as dist.zip file, which is available at the root of the project
