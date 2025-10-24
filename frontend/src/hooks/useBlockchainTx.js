import { useEffect, useState } from "react";
import { ethers } from "ethers";

const RPC_URL = "https://polygon-amoy.g.alchemy.com/v2/7aj78gW2At9x39qcp38bC";

export function useBlockchainTx(txHash) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!txHash) return;

    async function fetchTx() {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const tx = await provider.getTransaction(txHash);
        const receipt = await provider.getTransactionReceipt(txHash);
        if (!tx || !receipt) return;

        const block = await provider.getBlock(receipt.blockNumber);
        const data = {
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed?.toString(),
          confirmations: receipt.confirmations,
          timestamp: new Date(block.timestamp * 1000).toLocaleString(),
          from: tx.from,
          to: tx.to,
        };
        setInfo(data);
      } catch (err) {
        console.error("Blockchain tx fetch failed:", err);
      }
    }

    fetchTx();
  }, [txHash]);

  return info;
}
