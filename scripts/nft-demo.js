import { network } from "hardhat";
import { formatEther, parseEther } from "viem";

async function main() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, treasury, user1, user2] = await viem.getWalletClients();

  const mintPrice = parseEther("0.01");
  const contract = await viem.deployContract("HospitalQueueNFT", [
    "Hospital Queue Pass",
    "HQP",
    treasury.account.address,
    mintPrice,
  ]);

  const asUser1 = await viem.getContractAt("HospitalQueueNFT", contract.address, {
    client: { wallet: user1 },
  });
  const asUser2 = await viem.getContractAt("HospitalQueueNFT", contract.address, {
    client: { wallet: user2 },
  });

  console.log("=== Deploy ===");
  console.log("Contract:", contract.address);
  console.log("Owner:", owner.account.address);
  console.log("Treasury:", treasury.account.address);

  const treasuryBefore = await publicClient.getBalance({
    address: treasury.account.address,
  });

  await asUser1.write.mintQueueNFT(["ipfs://queue-pass-1.json"], {
    value: mintPrice,
  });
  await asUser2.write.mintQueueNFT(["ipfs://queue-pass-2.json"], {
    value: mintPrice,
  });

  const treasuryAfter = await publicClient.getBalance({
    address: treasury.account.address,
  });

  await asUser1.write.createProposal([
    "Increase Doctor Slots",
    "Add more doctor slots for evening appointments.",
    2,
  ]);

  await asUser1.write.vote([1n, true]);
  await asUser2.write.vote([1n, true]);

  const [forVotes, againstVotes, executed, cancelled] =
    await contract.read.getProposalVoteTotals([1n]);

  console.log("\n=== Mint Summary ===");
  console.log("User1 mint count:", (await contract.read.userMintCount([user1.account.address])).toString());
  console.log("User2 mint count:", (await contract.read.userMintCount([user2.account.address])).toString());
  console.log(
    "Treasury diff:",
    `${formatEther(treasuryAfter - treasuryBefore)} ETH`,
  );

  console.log("\n=== Voting Summary ===");
  console.log("Proposal #1 -> for:", forVotes.toString(), "against:", againstVotes.toString());
  console.log("Executed:", executed, "Cancelled:", cancelled);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
