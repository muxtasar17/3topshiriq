// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract HospitalQueueNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    struct Proposal {
        string title;
        string description;
        address creator;
        uint64 createdAt;
        uint64 deadline;
        uint32 forVotes;
        uint32 againstVotes;
        bool executed;
        bool cancelled;
    }

    uint256 public mintPrice;
    uint256 public proposalCount;
    uint256 public approvedProposalCount;
    uint256 private nextTokenId = 1;
    address payable public treasury;

    mapping(address => uint256) public userBalances;
    mapping(address => uint256) public userMintCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event QueueNFTMinted(
        address indexed minter,
        uint256 indexed tokenId,
        string tokenURI,
        uint256 paidAmount
    );
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed creator,
        string title,
        uint256 deadline
    );
    event ProposalUpdated(
        uint256 indexed proposalId,
        string title,
        string description
    );
    event ProposalCancelled(uint256 indexed proposalId);
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    event ProposalExecuted(uint256 indexed proposalId, bool approved);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event OwnerWithdraw(address indexed owner, uint256 amount);

    constructor(
        string memory name_,
        string memory symbol_,
        address payable treasury_,
        uint256 mintPrice_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        require(treasury_ != address(0), "Invalid treasury");
        require(mintPrice_ > 0, "Mint price must be > 0");

        treasury = treasury_;
        mintPrice = mintPrice_;
    }

    function mintQueueNFT(string calldata tokenUri)
        external
        payable
        nonReentrant
        returns (uint256 tokenId)
    {
        require(bytes(tokenUri).length > 0, "Token URI required");
        require(msg.value >= mintPrice, "Insufficient mint fee");

        tokenId = nextTokenId;
        nextTokenId += 1;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenUri);

        userBalances[msg.sender] += msg.value;
        userMintCount[msg.sender] += 1;

        (bool sent, ) = treasury.call{value: msg.value}("");
        require(sent, "Treasury transfer failed");

        emit QueueNFTMinted(msg.sender, tokenId, tokenUri, msg.value);
    }

    function createProposal(
        string calldata title,
        string calldata description,
        uint64 durationHours
    ) external returns (uint256 proposalId) {
        require(balanceOf(msg.sender) > 0, "Only NFT holder");
        require(bytes(title).length >= 3, "Title too short");
        require(bytes(description).length >= 10, "Description too short");
        require(durationHours >= 1 && durationHours <= 168, "Duration 1..168h");

        proposalId = ++proposalCount;
        Proposal storage proposal = proposals[proposalId];
        proposal.title = title;
        proposal.description = description;
        proposal.creator = msg.sender;
        proposal.createdAt = uint64(block.timestamp);
        proposal.deadline = uint64(block.timestamp + (durationHours * 1 hours));

        emit ProposalCreated(proposalId, msg.sender, title, proposal.deadline);
    }

    function updateProposal(
        uint256 proposalId,
        string calldata title,
        string calldata description
    ) external {
        Proposal storage proposal = proposals[proposalId];

        require(proposal.creator != address(0), "Proposal not found");
        require(proposal.creator == msg.sender, "Not proposal creator");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Already cancelled");
        require(block.timestamp < proposal.deadline, "Voting is over");
        require(
            proposal.forVotes + proposal.againstVotes == 0,
            "Already has votes"
        );
        require(bytes(title).length >= 3, "Title too short");
        require(bytes(description).length >= 10, "Description too short");

        proposal.title = title;
        proposal.description = description;

        emit ProposalUpdated(proposalId, title, description);
    }

    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];

        require(proposal.creator != address(0), "Proposal not found");
        require(
            msg.sender == proposal.creator || msg.sender == owner(),
            "Not authorized"
        );
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Already cancelled");

        proposal.cancelled = true;

        emit ProposalCancelled(proposalId);
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];

        require(proposal.creator != address(0), "Proposal not found");
        require(balanceOf(msg.sender) > 0, "Only NFT holder");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Proposal cancelled");
        require(block.timestamp < proposal.deadline, "Voting is over");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposal.forVotes += 1;
        } else {
            proposal.againstVotes += 1;
        }

        emit VoteCast(proposalId, msg.sender, support, 1);
    }

    function executeProposal(uint256 proposalId) external onlyOwner {
        Proposal storage proposal = proposals[proposalId];

        require(proposal.creator != address(0), "Proposal not found");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Proposal cancelled");
        require(block.timestamp >= proposal.deadline, "Voting still active");

        proposal.executed = true;
        bool approved = proposal.forVotes > proposal.againstVotes;

        if (approved) {
            approvedProposalCount += 1;
        }

        emit ProposalExecuted(proposalId, approved);
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Mint price must be > 0");
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }

    function setTreasury(address payable newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    function ownerWithdraw(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "Balance too low");
        (bool sent, ) = payable(owner()).call{value: amount}("");
        require(sent, "Withdraw failed");
        emit OwnerWithdraw(owner(), amount);
    }

    function getProposalVoteTotals(uint256 proposalId)
        external
        view
        returns (
            uint32 forVotes,
            uint32 againstVotes,
            bool executed,
            bool cancelled,
            uint64 deadline
        )
    {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.creator != address(0), "Proposal not found");

        return (
            proposal.forVotes,
            proposal.againstVotes,
            proposal.executed,
            proposal.cancelled,
            proposal.deadline
        );
    }
}
