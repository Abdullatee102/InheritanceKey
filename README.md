# InheritanceKey — Programmable Digital Ownership Succession

> **Programmable digital ownership succession protocol on Bohr Testnet.**

InheritanceKey provides a non-custodial blockchain succession layer allowing asset owners to designate trusted beneficiaries, deposit supported digital assets (Native BOT and ERC-20 tokens), configure inactivity timeouts, perform periodic on-chain check-ins, and enable beneficiaries to claim assigned allocations after a safety challenge period.

---

## 🌟 Core Product Idea

Standard Web3 wallets enforce immediate possession: _"Whoever holds the private key controls the asset."_

**InheritanceKey** introduces a non-custodial succession model:

```text
Owner
  ↓
Create Inheritance Plan
  ↓
Add Beneficiaries & Asset Allocations
  ↓
Periodically Check-In On-Chain
  ↓
Owner inactive > configured threshold
  ↓
Permissionless Trigger
  ↓
Challenge Period Window (Owner can recover anytime)
  ↓
Challenge Window Expires
  ↓
Beneficiary Claims Assigned Asset directly from Smart Contract
```

---

## 🏗️ Architecture & Deployment Overview

- **Network**: Bohr Testnet (Chain ID: `968`)
- **RPC Endpoint**: `https://rpc.bohr.life`
- **Block Explorer**: `https://scan.bohr.life`
- **Deployed Contract**: `0x825d966777D71b1E4987284c1551fd928dE27ff4`

### Unified Single-Contract Model

In accordance with strict architectural requirements, all protocol features are unified into **ONE single smart contract**: [`src/InheritanceKey.sol`](file:///c:/Users/hp/Documents/GitHub/InheritanceKey/src/InheritanceKey.sol).

No separate tokens, payment vaults, or external pool dependencies exist.

---

## 🛡️ Security Invariants & Trust Model

1. **NO Admin Asset Theft**: Protocol administrators (`DEFAULT_ADMIN_ROLE`, `PAUSER_ROLE`) possess **NO functions** to withdraw, redirect, or confiscate user inheritance funds under any circumstances.
2. **Owner Recovery Window**: During the challenge period, the legitimate owner can instantly recover and reset their plan with 1-click on-chain interaction.
3. **Checks-Effects-Interactions & ReentrancyGuard**: All asset claims and withdrawals update internal state before executing external token transfers.
4. **Strict Accounting Invariant**: Mathematical invariants guarantee `totalClaimed <= totalDeposited` for every supported asset.

---

## 📊 Plan State Machine

- **`ACTIVE` (0)**: Owner controls plan, deposits/withdraws assets, updates beneficiaries, and checks in.
- **`TRIGGERED` (1)**: Inactivity period elapsed; succession triggered. Challenge window timer active.
- **`READY_FOR_CLAIM` (2)**: Challenge period expired without owner recovery. Claims open for beneficiaries.
- **`COMPLETED` (3)**: All beneficiary allocations claimed.
- **`CANCELLED` (4)**: Plan deactivated by owner; un-claimed balances returned.

---

## 🧪 Testing & Verification

### Contract Test Suite (Foundry)

Execute comprehensive unit and property fuzz tests:

```bash
forge test -vvv
```

### Frontend Production Build

```bash
npm install
npm run build
```

---

## ⚠️ Scope Disclaimer

InheritanceKey is a programmable smart-contract digital asset succession mechanism. It is **not** a legally binding replacement for a will, probate court process, estate attorney, or jurisdiction-specific inheritance law. Users should consult legal professionals for estate planning.
