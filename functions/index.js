/**
 * ✅ PhishBlock — Web3 Hybrid Cloud Function
 * Anchors verified phishing reports to Polygon (Amoy Testnet)
 * and archives their metadata + image to IPFS via Web3.Storage.
 */

const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { ethers } = require("ethers");
const { Web3Storage, File } = require("web3.storage");

// Initialize Firebase Admin SDK
initializeApp();

// ====== 🔧 ENVIRONMENT VARIABLES ======
const RPC_URL = process.env.BLOCKCHAIN_RPC || "";
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || "";
const CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || "";
const NFT_TOKEN = process.env.NFT_TOKEN || ""; // short key from app.nft.storage
const VOTE_THRESHOLD = parseInt(process.env.VOTE_THRESHOLD || "10", 10);

// Polygon smart contract ABI
const CONTRACT_ABI = [
  "function anchor(bytes32 _hash, string calldata postId) public returns (bool)",
];

// ====== 🚀 FIRESTORE TRIGGER ======
exports.onPostUpdate = onDocumentUpdated(
  {
    document: "posts/{postId}",
    region: "asia-south1",
  },
  async (event) => {
    const newData = event.data.after.data();
    const oldData = event.data.before.data();
    const postId = event.params.postId;

    logger.info(`🧩 Vote threshold: ${VOTE_THRESHOLD}`);

    // Trigger anchoring only when threshold reached and not already anchored
    if (!oldData.anchored && (newData.upvotes || 0) >= VOTE_THRESHOLD) {
      logger.info(`🚀 Anchoring post ${postId}...`);

      try {
        // 1️⃣ Blockchain anchoring
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

        const hash = ethers.id(postId);
        const tx = await contract.anchor(hash, postId);
        await tx.wait();

        logger.info(`✅ Anchored post ${postId} on-chain, tx: ${tx.hash}`);

        // 2️⃣ Prepare JSON metadata
        const postData = {
          id: postId,
          url: newData.url || "",
          description: newData.description || "",
          authorId: newData.authorId || "",
          authorName: newData.authorName || "",
          createdAt: newData.createdAt || new Date().toISOString(),
          upvotes: newData.upvotes || 0,
          downvotes: newData.downvotes || 0,
          anchored: true,
          anchorTx: tx.hash,
          verification: {
            network: "Polygon Amoy Testnet",
            contract: CONTRACT_ADDRESS,
            hash: ethers.id(postId),
            anchoredAt: new Date().toISOString(),
          },
          decentralized: {
            provider: "web3.storage",
            uploadedAt: new Date().toISOString(),
          },
        };

        // 3️⃣ Create files for upload
        const files = [new File([JSON.stringify(postData)], "post.json", { type: "application/json" })];

        // Require an image before upload
        if (!newData.imageURL || newData.imageURL.trim() === "") {
          logger.error(`❌ Missing imageURL for post ${postId}. Skipping IPFS upload.`);
          await getFirestore().collection("posts").doc(postId).update({
            anchored: true,
            anchorTx: tx.hash,
            anchoringError: true,
            lastError: "Missing imageURL — IPFS upload skipped.",
            lastErrorAt: FieldValue.serverTimestamp(),
          });
          return;
        }

        // Fetch the image and attach
        const res = await fetch(newData.imageURL);
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          files.push(new File([buffer], "image.jpg", { type: "image/jpeg" }));
          logger.info(`🖼️ Attached image for post ${postId}`);
        } else {
          logger.error(`⚠️ Failed to fetch image for ${postId}: ${res.status}`);
        }

        // 4️⃣ Upload to IPFS via Web3.Storage
        const client = new Web3Storage({ token: NFT_TOKEN });
        try {
          const cid = await client.put(files);
          logger.info(`📦 Archived post ${postId} to IPFS: ${cid}`);

          // 5️⃣ Update Firestore metadata
          await getFirestore().collection("posts").doc(postId).update({
            anchored: true,
            anchorTx: tx.hash,
            archived: true,
            archivedAt: FieldValue.serverTimestamp(),
            anchoringError: false,
            decentralized: { provider: "web3.storage", cid },
          });

          logger.info(`✅ Firestore updated for post ${postId}`);
        } catch (uploadErr) {
          logger.error(`❌ NFT upload failed for ${postId}:`, uploadErr);
          await getFirestore().collection("posts").doc(postId).update({
            anchored: true,
            anchorTx: tx.hash,
            anchoringError: true,
            lastError: uploadErr.message || "IPFS upload failed",
            lastErrorAt: FieldValue.serverTimestamp(),
          });
        }
      } catch (err) {
        logger.error(`❌ Blockchain or upload error for ${postId}:`, err);
        await getFirestore().collection("posts").doc(postId).update({
          anchoringError: true,
          lastError: err.message || "Blockchain anchoring failed",
          lastErrorAt: FieldValue.serverTimestamp(),
        });
      }
    } else {
      logger.debug(`ℹ️ Skipped ${postId} — already anchored or below threshold`);
    }
  }
);
