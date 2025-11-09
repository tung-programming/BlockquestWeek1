import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineString } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { ethers } from "ethers";
import { Web3Storage, File } from "web3.storage";
import fetch from "node-fetch";

initializeApp();

// ✅ Blockchain environment variables
const RPC_URL = defineString("BLOCKCHAIN_RPC");
const PRIVATE_KEY = defineString("BLOCKCHAIN_PRIVATE_KEY");
const CONTRACT_ADDRESS = defineString("BLOCKCHAIN_CONTRACT_ADDRESS");

// ✅ IPFS / Web3.Storage environment variables
const NFT_STORAGE_TOKEN = defineString("NFT_STORAGE_TOKEN");
const PINATA_JWT = defineString("PINATA_JWT");

const CONTRACT_ABI = [
  "function anchor(bytes32 _hash, string calldata postId) public returns (bool)"
];

export const onPostUpdate = onDocumentUpdated(
  {
    document: "posts/{postId}",
    region: "asia-south1",
  },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    const postId = event.params.postId;

    const oldVotes = before.upvotes || 0;
    const newVotes = after.upvotes || 0;

    if (!before.anchored && oldVotes < 10 && newVotes >= 10) {
      logger.info(`🚀 [START] Anchoring + Archiving for post ${postId} (upvotes=${newVotes})`);

      const firestore = getFirestore();
      const postRef = firestore.collection("posts").doc(postId);

      try {
        logger.info("🧩 Connecting to Polygon RPC...");
        const provider = new ethers.JsonRpcProvider(RPC_URL.value());
        const wallet = new ethers.Wallet(PRIVATE_KEY.value(), provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS.value(), CONTRACT_ABI, wallet);
        const sender = await wallet.getAddress();
        logger.info(`✅ Connected as ${sender}`);

        const hash = ethers.id(postId);
        const tx = await contract.anchor(hash, postId);
        logger.info(`🚀 Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        logger.info(`✅ Confirmed in block ${receipt.blockNumber}`);

        await postRef.update({
          anchored: true,
          anchorTx: tx.hash,
          anchorTxUrl: `https://amoy.polygonscan.com/tx/${tx.hash}`,
          anchoredAt: new Date(),
        });

        // --- IPFS ARCHIVING ---
        logger.info("📦 Uploading metadata to Web3.Storage...");
        const client = new Web3Storage({ token: NFT_STORAGE_TOKEN.value() });
        const metadata = {
          url: after.url,
          description: after.description,
          author: after.authorName || "Anonymous",
          createdAt: after.createdAt || new Date().toISOString(),
          anchorTx: tx.hash,
          anchorTxUrl: `https://amoy.polygonscan.com/tx/${tx.hash}`,
        };
        const buffer = Buffer.from(JSON.stringify(metadata));
        const files = [new File([buffer], "metadata.json")];

        let cid;
        try {
          cid = await client.put(files);
          logger.info(`✅ Web3.Storage CID: ${cid}`);
        } catch (uploadErr) {
          logger.warn("⚠️ Web3.Storage failed, trying Pinata...");
          const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${PINATA_JWT.value()}`,
            },
            body: JSON.stringify(metadata),
          });
          const data = await res.json();
          cid = data.IpfsHash;
          logger.info(`✅ Pinata CID: ${cid}`);
        }

        await postRef.update({
          archiveCid: cid,
          archivedAt: new Date(),
          ipfsMetadata: `https://w3s.link/ipfs/${cid}`,
          ipfsGateway: `https://gateway.pinata.cloud/ipfs/${cid}`,
          backupLink: `https://w3s.link/ipfs/${cid}`,
          evidenceHash: hash,
        });

        logger.info(`🎯 Archival complete for ${postId}`);
      } catch (err) {
        logger.error(`❌ Error processing post ${postId}:`, err);
        await postRef.update({
          anchoringError: true,
          lastError: err.message || "Unexpected failure",
          lastErrorAt: new Date(),
        });
      }
    }
  }
);
