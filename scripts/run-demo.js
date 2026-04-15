import { network } from "hardhat";
import { formatEther, parseEther } from "viem";

function toEth(value) {
  return `${formatEther(value)} ETH`;
}

async function main() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, allowedPayer, hospitalWallet, emergencyWallet, otherUser] =
    await viem.getWalletClients();

  const minPayment = parseEther("0.01");

  const contract = await viem.deployContract("ShifoxonaNavbat", [
    allowedPayer.account.address,
    hospitalWallet.account.address,
    emergencyWallet.account.address,
    minPayment,
  ]);

  console.log("=== Deploy Info ===");
  console.log("Contract:", contract.address);
  console.log("Owner:", owner.account.address);
  console.log("Allowed payer:", allowedPayer.account.address);
  console.log("Hospital wallet:", hospitalWallet.account.address);
  console.log("Emergency wallet:", emergencyWallet.account.address);
  console.log("Min payment:", toEth(minPayment));

  const asAllowedPayer = await viem.getContractAt(
    "ShifoxonaNavbat",
    contract.address,
    { client: { wallet: allowedPayer } },
  );
  const asOtherUser = await viem.getContractAt("ShifoxonaNavbat", contract.address, {
    client: { wallet: otherUser },
  });

  console.log("\n=== Revert Check (wrong address) ===");
  try {
    await asOtherUser.write.navbatUchunTolov([], { value: minPayment });
    console.log("Unexpected: wrong address payment passed");
  } catch (error) {
    console.log("Expected revert: only allowed address can pay");
  }

  const hospitalBefore = await publicClient.getBalance({
    address: hospitalWallet.account.address,
  });
  const emergencyBefore = await publicClient.getBalance({
    address: emergencyWallet.account.address,
  });

  console.log("\n=== Payment Flow ===");
  const tx1 = await asAllowedPayer.write.navbatUchunTolov([], {
    value: minPayment,
  });
  await publicClient.waitForTransactionReceipt({ hash: tx1 });
  console.log("1) Normal payment sent:", toEth(minPayment));

  const tx2 = await asAllowedPayer.write.navbatUchunTolov([], {
    value: minPayment * 2n,
  });
  await publicClient.waitForTransactionReceipt({ hash: tx2 });
  console.log("2) Mid payment sent:", toEth(minPayment * 2n));

  const tx3 = await asAllowedPayer.write.navbatUchunTolov([], {
    value: minPayment * 3n,
  });
  await publicClient.waitForTransactionReceipt({ hash: tx3 });
  console.log("3) Emergency payment sent:", toEth(minPayment * 3n));

  const storedUserBalance = await contract.read.userBalances([
    allowedPayer.account.address,
  ]);
  const paymentCount = await contract.read.queuePaymentsCount([
    allowedPayer.account.address,
  ]);

  const hospitalAfter = await publicClient.getBalance({
    address: hospitalWallet.account.address,
  });
  const emergencyAfter = await publicClient.getBalance({
    address: emergencyWallet.account.address,
  });

  console.log("\n=== Mapping Data ===");
  console.log("userBalances[allowed]:", toEth(storedUserBalance));
  console.log("queuePaymentsCount[allowed]:", paymentCount.toString());

  console.log("\n=== Receiver Balance Diff ===");
  console.log("Hospital +", toEth(hospitalAfter - hospitalBefore));
  console.log("Emergency +", toEth(emergencyAfter - emergencyBefore));

  const contractBalance = await publicClient.getBalance({
    address: contract.address,
  });
  console.log("\nContract balance (ownerWithdraw uchun):", toEth(contractBalance));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
