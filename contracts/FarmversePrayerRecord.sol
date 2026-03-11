// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FarmversePrayerRecord
 * @notice Ghi lời cầu nguyện của người nông dân Việt Nam lên Avalanche C-Chain
 * @dev Dùng để xác lập kỷ lục thế giới — mỗi prayer là 1 bằng chứng immutable
 *
 * Deployed: Avalanche C-Chain Mainnet (Chain ID: 43114)
 * Address:  0x853185f76a3daa50432c2802846c7a4f38a1a3f0
 * Explorer: https://snowtrace.io/address/0x853185f76a3daa50432c2802846c7a4f38a1a3f0
 */
contract FarmversePrayerRecord {

    event PrayerRecorded(
        uint256 indexed prayerId,
        uint32  indexed userId,
        bytes32         contentHash,
        bytes32         identityHash,
        uint256         timestamp,
        bytes2          countryCode
    );

    event OperatorUpdated(address indexed operator, bool status);

    struct PrayerRecord {
        bytes32 contentHash;
        bytes32 identityHash;
        uint256 timestamp;
        uint32  userId;
        uint32  userPrayerSeq;
        bytes2  countryCode;
        bool    exists;
    }

    mapping(uint256 => PrayerRecord) public prayers;
    mapping(bytes32 => bool) public contentHashExists;
    mapping(bytes32 => uint32) public identityPrayerCount;
    mapping(uint32 => uint32) public userPrayerCount;
    mapping(address => bool) public operators;

    address public owner;
    uint256 public totalPrayers;
    uint256 public totalUniqueUsers;
    uint256 public firstPrayerTimestamp;

    string public constant PROJECT_NAME = "FARMVERSE";
    bytes2  public constant DEFAULT_COUNTRY = 0x564e; // "VN"

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyOperator() {
        require(operators[msg.sender], "Not operator");
        _;
    }

    constructor() {
        owner = msg.sender;
        operators[msg.sender] = true;
    }

    function setOperator(address _operator, bool _status) external onlyOwner {
        operators[_operator] = _status;
        emit OperatorUpdated(_operator, _status);
    }

    function recordPrayer(
        uint256 prayerId,
        bytes32 contentHash,
        bytes32 identityHash,
        uint32  userId
    ) external onlyOperator {
        require(!prayers[prayerId].exists,       "Prayer ID already exists");
        require(!contentHashExists[contentHash], "Duplicate content hash");

        if (userPrayerCount[userId] == 0) {
            totalUniqueUsers++;
        }

        uint32 seq = userPrayerCount[userId] + 1;

        if (totalPrayers == 0) {
            firstPrayerTimestamp = block.timestamp;
        }

        prayers[prayerId] = PrayerRecord({
            contentHash:   contentHash,
            identityHash:  identityHash,
            timestamp:     block.timestamp,
            userId:        userId,
            userPrayerSeq: seq,
            countryCode:   DEFAULT_COUNTRY,
            exists:        true
        });

        contentHashExists[contentHash] = true;
        identityPrayerCount[identityHash]++;
        userPrayerCount[userId]++;
        totalPrayers++;

        emit PrayerRecorded(
            prayerId,
            userId,
            contentHash,
            identityHash,
            block.timestamp,
            DEFAULT_COUNTRY
        );
    }

    function getStats() external view returns (
        uint256 total,
        uint256 uniqueUsers,
        uint256 startTime,
        string memory projectName
    ) {
        return (totalPrayers, totalUniqueUsers, firstPrayerTimestamp, PROJECT_NAME);
    }

    function verifyPrayer(
        uint256 prayerId,
        bytes32 expectedContentHash,
        bytes32 expectedIdentityHash
    ) external view returns (
        bool    valid,
        uint256 timestamp,
        uint32  userId,
        uint32  seq
    ) {
        PrayerRecord memory p = prayers[prayerId];
        valid = p.exists
            && p.contentHash  == expectedContentHash
            && p.identityHash == expectedIdentityHash;
        return (valid, p.timestamp, p.userId, p.userPrayerSeq);
    }

    function getPrayer(uint256 prayerId) external view returns (
        bytes32 contentHash,
        bytes32 identityHash,
        uint256 timestamp,
        uint32  userId,
        uint32  userPrayerSeq,
        bytes2  countryCode
    ) {
        PrayerRecord memory p = prayers[prayerId];
        require(p.exists, "Prayer not found");
        return (p.contentHash, p.identityHash, p.timestamp, p.userId, p.userPrayerSeq, p.countryCode);
    }

    function getUserPrayerCount(uint32 userId) external view returns (uint32) {
        return userPrayerCount[userId];
    }
}
