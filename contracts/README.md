# Smart Contracts — Organic Kingdom (FARMVERSE)

All contracts deployed on **Avalanche C-Chain Mainnet** (Chain ID: 43114).

## Deployed Contracts

| Contract | Address | Standard | Purpose |
|---|---|---|---|
| [FarmverseNFTCard](./FarmverseNFTCard.sol) | [`0x9b801...01ec`](https://snowtrace.io/address/0x9b801a3e4144b100130506d5f1a2057355e601ec) | ERC-721 | Knowledge Card NFTs from boss defeats |
| [FarmversePrayerRecord](./FarmversePrayerRecord.sol) | [`0x85318...3f0`](https://snowtrace.io/address/0x853185f76a3daa50432c2802846c7a4f38a1a3f0) | Custom | On-chain prayer immutability records |
| [MerkleRootStore](./MerkleRootStore.sol) | [`0x27CD5...775`](https://snowtrace.io/address/0x27CD564b8A98EFAa4Aff145Ee2E158bAE0051775) | Custom | RWA IoT data + prayer Merkle roots |
| CoinbaseSmartWalletFactory | [`0x0BA5E...0B2`](https://snowtrace.io/address/0x0BA5ED0c6AA8c49038539082F85EaF0c14b2f0B2) | ERC-4337 | Passkey-based smart wallet factory |
| EntryPoint v0.6 | [`0x5FF13...789`](https://snowtrace.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789) | ERC-4337 | User operation bundler entry point |

## Contract Details

### FarmverseNFTCard (ERC-721)
**Address:** `0x9b801a3e4144b100130506d5f1a2057355e601ec`

Knowledge Card NFTs awarded to players who defeat bosses in the Organic Kingdom farming game.

- AI-generated educational content (GPT-4o-mini) based on defeated boss theme
- AI-generated unique artwork (Gemini)
- Metadata stored permanently on IPFS via Pinata
- Minted by game server only (`onlyOwner`) — players cannot self-mint
- Players truly own their NFTs on-chain; no admin revoke function

```
safeMint(address to, string uri) → mints NFT with IPFS metadata URI
tokenURI(uint256 tokenId) → returns IPFS metadata URI
totalSupply() → total NFTs minted
```

---

### FarmversePrayerRecord
**Address:** `0x853185f76a3daa50432c2802846c7a4f38a1a3f0`

Records individual prayers from Vietnamese farmers immutably on-chain. Supports the Guinness World Record attempt for most prayers recorded on blockchain.

- Each prayer stored with `contentHash` + `identityHash` (privacy-preserving)
- Tracks per-user prayer sequence numbers
- Operator-based access control (game server = operator)
- Duplicate content hash prevention

```
recordPrayer(prayerId, contentHash, identityHash, userId)
verifyPrayer(prayerId, expectedContentHash, expectedIdentityHash) → (valid, timestamp, userId, seq)
getStats() → (total, uniqueUsers, startTime, projectName)
```

---

### MerkleRootStore
**Address:** `0x27CD564b8A98EFAa4Aff145Ee2E158bAE0051775`

Anchors Merkle roots on-chain for two use cases:

1. **RWA IoT Data** — Arduino sensor readings (soil moisture, temperature, humidity) hashed hourly to prove organic farm data integrity
2. **Prayer Batches** — keccak256 Merkle tree of player prayers committed to chain; any player can verify their prayer via Merkle proof

```
storeRoot(bytes32 root, uint256 count)          → single root
storeBatch(bytes32[] roots, uint256[] counts)   → up to 100 roots per tx
isRootStored(bytes32 root) → bool
getStats() → (rootCount, totalItemsAnchored)
```

---

### ERC-4337 Smart Wallets (External)

The game uses **Coinbase Smart Wallet** (ERC-4337) to enable:
- **Passkey login** (WebAuthn / Face ID / Touch ID) — no seed phrase
- **Gas sponsorship** via Pimlico Paymaster
- Familiar Web2 UX for non-crypto farmers

These contracts are part of the Coinbase Wallet SDK ecosystem, not custom deployments.

---

## Development

Compiled with Hardhat on Solidity `^0.8.19` / `^0.8.24`.
OpenZeppelin Contracts v5 used for ERC-721 and Ownable base classes.

```bash
# Install dependencies
npm install --save-dev hardhat @openzeppelin/contracts

# Compile
npx hardhat compile

# Deploy to Fuji testnet
npx hardhat run scripts/deploy.ts --network fuji
```

See [`deployments.json`](./deployments.json) for all addresses and network configuration.
