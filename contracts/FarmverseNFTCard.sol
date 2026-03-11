// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FarmverseNFTCard
 * @notice Knowledge Card NFTs for Organic Kingdom — earned by defeating bosses
 * @dev ERC-721 with URI storage and enumeration. Minted by game server (owner) only.
 *
 * Each NFT card is unique:
 *   - AI-generated content (GPT-4o-mini) based on the defeated boss theme
 *   - AI-generated artwork (Gemini) unique to each card
 *   - Metadata stored permanently on IPFS via Pinata
 *   - Players truly own them on-chain — no admin can revoke
 *
 * Deployed: Avalanche C-Chain Mainnet (Chain ID: 43114)
 * Address:  0x9b801a3e4144b100130506d5f1a2057355e601ec
 * Explorer: https://snowtrace.io/address/0x9b801a3e4144b100130506d5f1a2057355e601ec
 */
contract FarmverseNFTCard is ERC721URIStorage, ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;

    event CardMinted(
        uint256 indexed tokenId,
        address indexed to,
        string  uri
    );

    constructor(address initialOwner)
        ERC721("FarmverseNFTCard", "FVNFT")
        Ownable(initialOwner)
    {}

    /**
     * @notice Mint a new Knowledge Card NFT to a player's wallet
     * @dev Called by game server after boss defeat + NFT generation pipeline
     * @param to    Player's wallet address
     * @param uri   IPFS metadata URI (pinned via Pinata)
     */
    function safeMint(address to, string memory uri) external onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit CardMinted(tokenId, to, uri);
    }

    // ============================================================
    // REQUIRED OVERRIDES (ERC721URIStorage + ERC721Enumerable)
    // ============================================================

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
