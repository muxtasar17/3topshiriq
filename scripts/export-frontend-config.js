import fs from "node:fs/promises";
import path from "node:path";

const artifactPath = path.join(
  process.cwd(),
  "artifacts",
  "contracts",
  "HospitalQueueNFT.sol",
  "HospitalQueueNFT.json",
);
const deploymentPath = path.join(process.cwd(), "deployments", "latest.json");
const outPath = path.join(process.cwd(), "frontend", "contract-config.js");

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const artifact = await readJson(artifactPath);

  let contractAddress = process.env.CONTRACT_ADDRESS ?? "";
  try {
    const deployment = await readJson(deploymentPath);
    contractAddress = contractAddress || deployment.address || "";
  } catch {
    // ignore missing deployment file
  }

  const content = `export const CONTRACT_ADDRESS = "${contractAddress}";

export const CONTRACT_ABI = ${JSON.stringify(artifact.abi, null, 2)};
`;

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, content, "utf8");

  console.log("Frontend config exported:", outPath);
  if (!contractAddress) {
    console.log(
      "Warning: CONTRACT_ADDRESS bo'sh. Deploy qiling yoki CONTRACT_ADDRESS env bering.",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
