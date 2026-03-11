// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MerkleRootStore
/// @notice Anchors IoT sensor data and prayer Merkle roots on Avalanche for tamper-proof verification
/// @dev Optimized for Avalanche C-Chain (Cancun EVM). Part of Organic Kingdom / FARMVERSE.
///
/// Deployed: Avalanche C-Chain Mainnet (Chain ID: 43114)
/// Address:  0x27CD564b8A98EFAa4Aff145Ee2E158bAE0051775
/// Explorer: https://snowtrace.io/address/0x27CD564b8A98EFAa4Aff145Ee2E158bAE0051775
///
/// Use cases:
///   1. RWA IoT — Arduino sensor readings (soil moisture, temperature, humidity) hashed
///      and committed hourly to prove organic farm data was not tampered with.
///   2. Prayer batches — keccak256 Merkle tree of player prayers committed to chain,
///      allowing any player to verify their prayer via Merkle proof.
contract MerkleRootStore is Ownable {
    // ============================================================
    // ERRORS
    // ============================================================
    error RootAlreadyStored(bytes32 root);
    error EmptyRoot();
    error EmptyBatch();
    error BatchTooLarge();

    // ============================================================
    // EVENTS
    // ============================================================
    event MerkleRootStored(
        bytes32 indexed root,
        uint256 prayerCount,
        uint256 timestamp,
        address indexed submitter
    );

    // ============================================================
    // STATE
    // ============================================================

    /// @notice Maps merkle root => timestamp (0 = not stored)
    mapping(bytes32 => uint256) public merkleRoots;

    /// @notice Maps merkle root => prayer/reading count in that batch
    mapping(bytes32 => uint256) public rootPrayerCount;

    /// @notice Total number of roots stored
    uint256 public rootCount;

    /// @notice Total number of prayers/readings anchored on-chain
    uint256 public totalPrayersAnchored;

    /// @notice Maximum roots per batch call
    uint256 public constant MAX_BATCH_SIZE = 100;

    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    constructor(address initialOwner) Ownable(initialOwner) {}

    // ============================================================
    // WRITE FUNCTIONS
    // ============================================================

    /// @notice Store a single Merkle root on-chain
    /// @param root The Merkle root of batched hashes (prayers or IoT readings)
    /// @param prayerCount Number of items in this batch
    function storeRoot(bytes32 root, uint256 prayerCount) external onlyOwner {
        if (root == bytes32(0)) revert EmptyRoot();
        if (merkleRoots[root] != 0) revert RootAlreadyStored(root);

        merkleRoots[root] = block.timestamp;
        rootPrayerCount[root] = prayerCount;

        unchecked {
            ++rootCount;
            totalPrayersAnchored += prayerCount;
        }

        emit MerkleRootStored(root, prayerCount, block.timestamp, msg.sender);
    }

    /// @notice Store multiple Merkle roots in one transaction (gas efficient)
    /// @param roots Array of Merkle roots
    /// @param prayerCounts Array of item counts (must match roots length)
    function storeBatch(
        bytes32[] calldata roots,
        uint256[] calldata prayerCounts
    ) external onlyOwner {
        uint256 len = roots.length;
        if (len == 0) revert EmptyBatch();
        if (len > MAX_BATCH_SIZE) revert BatchTooLarge();
        require(len == prayerCounts.length, "Length mismatch");

        uint256 ts = block.timestamp;
        uint256 totalItems = 0;

        for (uint256 i = 0; i < len; ) {
            bytes32 root = roots[i];
            if (root == bytes32(0)) revert EmptyRoot();
            if (merkleRoots[root] != 0) revert RootAlreadyStored(root);

            merkleRoots[root] = ts;
            rootPrayerCount[root] = prayerCounts[i];
            totalItems += prayerCounts[i];

            emit MerkleRootStored(root, prayerCounts[i], ts, msg.sender);
            unchecked { ++i; }
        }

        unchecked {
            rootCount += len;
            totalPrayersAnchored += totalItems;
        }
    }

    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================

    /// @notice Check if a Merkle root exists on-chain
    /// @param root The Merkle root to verify
    /// @return True if root was stored
    function isRootStored(bytes32 root) external view returns (bool) {
        return merkleRoots[root] != 0;
    }

    /// @notice Get the timestamp when a root was stored
    /// @param root The Merkle root
    /// @return Unix timestamp (0 if not stored)
    function getRootTimestamp(bytes32 root) external view returns (uint256) {
        return merkleRoots[root];
    }

    /// @notice Get item count for a specific root
    /// @param root The Merkle root
    /// @return Number of items (prayers or IoT readings) in that batch
    function getRootPrayerCount(bytes32 root) external view returns (uint256) {
        return rootPrayerCount[root];
    }

    /// @notice Get summary stats
    /// @return _rootCount Total roots stored
    /// @return _totalItems Total items anchored
    function getStats() external view returns (uint256 _rootCount, uint256 _totalItems) {
        return (rootCount, totalPrayersAnchored);
    }
}
