import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.4/+esm";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contract-config.js";

const connectBtn = document.getElementById("connectBtn");
const refreshBtn = document.getElementById("refreshBtn");
const mintBtn = document.getElementById("mintBtn");
const createProposalBtn = document.getElementById("createProposalBtn");
const voteForBtn = document.getElementById("voteForBtn");
const voteAgainstBtn = document.getElementById("voteAgainstBtn");
const inspectBtn = document.getElementById("inspectBtn");
const globalMessage = document.getElementById("globalMessage");

const walletAddressEl = document.getElementById("walletAddress");
const contractAddressEl = document.getElementById("contractAddress");
const mintPriceEl = document.getElementById("mintPrice");
const proposalCountEl = document.getElementById("proposalCount");
const proposalViewEl = document.getElementById("proposalView");

let provider;
let signer;
let contract;
let mintPriceWei = 0n;

contractAddressEl.textContent = CONTRACT_ADDRESS || "Not deployed";

function setMessage(text, mode = "info") {
  globalMessage.textContent = text;
  if (mode === "error") globalMessage.style.color = "#b23b3b";
  else if (mode === "success") globalMessage.style.color = "#1f8b5c";
  else globalMessage.style.color = "#37516a";
}

function ensureWalletAvailable() {
  if (!window.ethereum) {
    throw new Error("MetaMask topilmadi. Brauzerga extension o'rnating.");
  }
}

function ensureContractReady() {
  if (!CONTRACT_ADDRESS || CONTRACT_ABI.length === 0) {
    throw new Error(
      "Kontrakt konfiguratsiyasi bo'sh. `npm run export:frontend` bajaring.",
    );
  }
  if (!contract) {
    throw new Error("Avval wallet connect qiling.");
  }
}

function toId(value) {
  return BigInt(Number(value));
}

async function connectWallet() {
  try {
    ensureWalletAvailable();
    ensureContractReady();

    await window.ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const address = await signer.getAddress();
    walletAddressEl.textContent = address;
    setMessage("Wallet muvaffaqiyatli ulandi.", "success");
    await refreshDashboard();
  } catch (error) {
    setMessage(error.message, "error");
  }
}

async function refreshDashboard() {
  try {
    ensureContractReady();

    const [mintPrice, proposalCount] = await Promise.all([
      contract.mintPrice(),
      contract.proposalCount(),
    ]);

    mintPriceWei = mintPrice;
    mintPriceEl.textContent = `${ethers.formatEther(mintPrice)} ETH`;
    proposalCountEl.textContent = proposalCount.toString();
  } catch (error) {
    setMessage(error.message, "error");
  }
}

async function mintNFT() {
  try {
    ensureContractReady();
    const tokenUri = document.getElementById("tokenUri").value.trim();
    if (!tokenUri) throw new Error("Token URI kiriting.");

    const tx = await contract.mintQueueNFT(tokenUri, { value: mintPriceWei });
    setMessage("Mint tranzaksiya yuborildi. Tasdiqlanishini kuting...");
    await tx.wait();

    setMessage("NFT muvaffaqiyatli mint qilindi.", "success");
    await refreshDashboard();
  } catch (error) {
    setMessage(error.shortMessage || error.message, "error");
  }
}

async function createProposal() {
  try {
    ensureContractReady();
    const title = document.getElementById("proposalTitle").value.trim();
    const description = document
      .getElementById("proposalDescription")
      .value.trim();
    const duration = Number(document.getElementById("proposalDuration").value);

    if (!title || !description) {
      throw new Error("Title va description kiriting.");
    }
    if (!duration || duration < 1 || duration > 168) {
      throw new Error("Duration 1..168 oralig'ida bo'lishi kerak.");
    }

    const tx = await contract.createProposal(title, description, duration);
    setMessage("Proposal tranzaksiya yuborildi...");
    await tx.wait();

    setMessage("Proposal yaratildi.", "success");
    await refreshDashboard();
  } catch (error) {
    setMessage(error.shortMessage || error.message, "error");
  }
}

async function vote(support) {
  try {
    ensureContractReady();
    const proposalIdInput = document.getElementById("voteProposalId").value;
    const proposalId = toId(proposalIdInput);
    const tx = await contract.vote(proposalId, support);
    setMessage("Vote tranzaksiya yuborildi...");
    await tx.wait();

    setMessage(
      support ? "FOR ovoz muvaffaqiyatli berildi." : "AGAINST ovoz berildi.",
      "success",
    );
    await inspectProposal();
  } catch (error) {
    setMessage(error.shortMessage || error.message, "error");
  }
}

async function inspectProposal() {
  try {
    ensureContractReady();
    const proposalIdInput = document.getElementById("inspectProposalId").value;
    const proposalId = toId(proposalIdInput);

    const [proposal, totals] = await Promise.all([
      contract.proposals(proposalId),
      contract.getProposalVoteTotals(proposalId),
    ]);

    let hasMyVote = false;
    if (signer) {
      const myAddress = await signer.getAddress();
      hasMyVote = await contract.hasVoted(proposalId, myAddress);
    }

    const deadlineDate = new Date(Number(totals[4]) * 1000).toLocaleString();
    proposalViewEl.innerHTML = `
      <p><strong>Title:</strong> ${proposal.title}</p>
      <p><strong>Description:</strong> ${proposal.description}</p>
      <p><strong>Creator:</strong> ${proposal.creator}</p>
      <p><strong>For / Against:</strong> ${totals[0].toString()} / ${totals[1].toString()}</p>
      <p><strong>Executed:</strong> ${totals[2]} | <strong>Cancelled:</strong> ${totals[3]}</p>
      <p><strong>Deadline:</strong> ${deadlineDate}</p>
      <p><strong>Your Vote Status:</strong> ${hasMyVote ? "Voted" : "Not voted"}</p>
    `;
  } catch (error) {
    setMessage(error.shortMessage || error.message, "error");
  }
}

connectBtn.addEventListener("click", connectWallet);
refreshBtn.addEventListener("click", refreshDashboard);
mintBtn.addEventListener("click", mintNFT);
createProposalBtn.addEventListener("click", createProposal);
voteForBtn.addEventListener("click", () => vote(true));
voteAgainstBtn.addEventListener("click", () => vote(false));
inspectBtn.addEventListener("click", inspectProposal);

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}
