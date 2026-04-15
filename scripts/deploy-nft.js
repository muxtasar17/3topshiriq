import fs from "node:fs/promises";
import path from "node:path";

import { network } from "hardhat";
import { parseEther } from "viem";

async function main() {
  const { viem } = await network.connect();
  const [deployer] = await viem.getWalletClients();

  const name = process.env.COLLECTION_NAME ?? "Hospital Queue Pass";
  const symbol = process.env.COLLECTION_SYMBOL ?? "HQP";
  const treasury = process.env.TREASURY_ADDRESS ?? deployer.account.address;
  const mintPriceEth = process.env.MINT_PRICE_ETH ?? "0.01";
  const mintPrice = parseEther(mintPriceEth);
  const networkName = process.env.HARDHAT_NETWORK ?? "hardhat";

  const contract = await viem.deployContract("HospitalQueueNFT", [
    name,
    symbol,
    treasury,
    mintPrice,
  ]);

  const deployment = {
    network: networkName,
    contractName: "HospitalQueueNFT",
    address: contract.address,
    deployer: deployer.account.address,
    args: {
      name,
      symbol,
      treasury,
      mintPriceEth,
    },
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(process.cwd(), "deployments");
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(
    path.join(outDir, "latest.json"),
    JSON.stringify(deployment, null, 2),
    "utf8",
  );

  console.log("=== NFT Deploy Result ===");
  console.log("Network:", networkName);
  console.log("Contract:", contract.address);
  console.log("Deployer:", deployer.account.address);
  console.log("Treasury:", treasury);
  console.log("Mint price:", mintPriceEth, "ETH");
  console.log("Saved:", path.join(outDir, "latest.json"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
