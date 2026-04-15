import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { formatEther, parseEther } from "viem";

describe("HospitalQueueNFT", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, treasury, user1, user2, user3] = await viem.getWalletClients();

  async function deployFixture() {
    return viem.deployContract("HospitalQueueNFT", [
      "Hospital Queue Pass",
      "HQP",
      treasury.account.address,
      parseEther("0.01"),
    ]);
  }

  it("mints NFT and forwards fee to treasury", async function () {
    const contract = await deployFixture();
    const asUser1 = await viem.getContractAt("HospitalQueueNFT", contract.address, {
      client: { wallet: user1 },
    });

    const treasuryBefore = await publicClient.getBalance({
      address: treasury.account.address,
    });

    const mintTx = await asUser1.write.mintQueueNFT([
      "ipfs://hospital-queue-pass-1.json",
    ], {
      value: parseEther("0.01"),
    });

    await publicClient.waitForTransactionReceipt({ hash: mintTx });

    const treasuryAfter = await publicClient.getBalance({
      address: treasury.account.address,
    });

    const userMintCount = await contract.read.userMintCount([user1.account.address]);
    const userPaid = await contract.read.userBalances([user1.account.address]);
    const ownerOfToken1 = await contract.read.ownerOf([1n]);

    assert.equal(ownerOfToken1.toLowerCase(), user1.account.address.toLowerCase());
    assert.equal(userMintCount, 1n);
    assert.equal(userPaid, parseEther("0.01"));
    assert.equal(
      formatEther(treasuryAfter - treasuryBefore),
      formatEther(parseEther("0.01")),
    );
  });

  it("allows holders to create proposal and vote", async function () {
    const contract = await deployFixture();

    const asUser1 = await viem.getContractAt("HospitalQueueNFT", contract.address, {
      client: { wallet: user1 },
    });
    const asUser2 = await viem.getContractAt("HospitalQueueNFT", contract.address, {
      client: { wallet: user2 },
    });
    const asUser3 = await viem.getContractAt("HospitalQueueNFT", contract.address, {
      client: { wallet: user3 },
    });

    await asUser1.write.mintQueueNFT(["ipfs://hospital-queue-pass-1.json"], {
      value: parseEther("0.01"),
    });
    await asUser2.write.mintQueueNFT(["ipfs://hospital-queue-pass-2.json"], {
      value: parseEther("0.01"),
    });

    await asUser1.write.createProposal([
      "Weekend Doctor Shift",
      "Add one extra doctor to reduce weekend waiting time.",
      2,
    ]);

    await asUser2.write.vote([1n, true]);

    const hasUser2Voted = await contract.read.hasVoted([1n, user2.account.address]);
    const [forVotes, againstVotes] = await contract.read.getProposalVoteTotals([1n]);

    assert.equal(hasUser2Voted, true);
    assert.equal(forVotes, 1);
    assert.equal(againstVotes, 0);

    await assert.rejects(async () => {
      await asUser3.write.vote([1n, true]);
    });
  });

  it("only owner can change mint price", async function () {
    const contract = await deployFixture();
    const asUser1 = await viem.getContractAt("HospitalQueueNFT", contract.address, {
      client: { wallet: user1 },
    });

    await assert.rejects(async () => {
      await asUser1.write.setMintPrice([parseEther("0.02")]);
    });

    await contract.write.setMintPrice([parseEther("0.02")]);
    const newMintPrice = await contract.read.mintPrice();

    assert.equal(newMintPrice, parseEther("0.02"));
    assert.equal(
      (await contract.read.owner()).toLowerCase(),
      owner.account.address.toLowerCase(),
    );
  });
});
