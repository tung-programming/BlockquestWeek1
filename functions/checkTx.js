// checkTx.js
// Usage: node checkTx.js <TX_HASH> [RPC_URL]
// Example: node checkTx.js 0x2c9b... https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY

const { ethers } = require("ethers");

async function main() {
  const txHash = process.argv[2];
  const rpc = process.argv[3] || process.env.BLOCKCHAIN_RPC;

  if (!txHash) {
    console.error("Usage: node checkTx.js <txHash> [RPC_URL]");
    process.exit(1);
  }
  if (!rpc) {
    console.error("No RPC URL provided. Pass it as 2nd arg or set BLOCKCHAIN_RPC env var.");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpc);
  console.log("Using RPC:", rpc);
  console.log("Fetching transaction:", txHash);

  const tx = await provider.getTransaction(txHash);
  console.log("\n=== TRANSACTION ===");
  console.log("hash:", tx?.hash);
  console.log("from:", tx?.from);
  console.log("to:", tx?.to);
  console.log("value:", tx?.value?.toString());
  console.log("nonce:", tx?.nonce);
  console.log("data (hex, truncated):", tx?.data?.slice(0, 200) + (tx?.data?.length > 200 ? "...(truncated)" : ""));

  const receipt = await provider.getTransactionReceipt(txHash);
  console.log("\n=== RECEIPT ===");
  console.log("status:", receipt?.status);
  console.log("blockNumber:", receipt?.blockNumber);
  console.log("gasUsed:", receipt?.gasUsed?.toString());
  console.log("logs count:", receipt?.logs?.length);

  // Try to decode input using your anchor function signature
  const CONTRACT_ABI = [
    "function anchor(bytes32 _hash, string postId) public returns (bool)"
  ];
  const iface = new ethers.Interface(CONTRACT_ABI);

  if (tx && tx.data && tx.data !== "0x") {
    try {
      const decoded = iface.decodeFunctionData("anchor", tx.data);
      console.log("\n=== DECODED anchor(...) ===");
      console.log("fileHash (bytes32):", decoded[0]);
      console.log("uri / postId (string):", decoded[1]);
      console.log("recomputed hash of postId:", ethers.id(decoded[1]));
    } catch (e) {
      console.log("\nCould not decode input with provided ABI:", e.message);
    }
  }

  // Try parsing logs with same ABI (if events exist)
  console.log("\n=== PARSED LOGS (attempt) ===");
  for (const log of receipt.logs || []) {
    try {
      const parsed = iface.parseLog(log);
      console.log("parsed event:", parsed.name, parsed.args);
    } catch (err) {
      // not parsable with this ABI; ignore
    }
  }

  console.log("\n=== FINISHED STEP 1 ===");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
