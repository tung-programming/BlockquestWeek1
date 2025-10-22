const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { ethers } = require("ethers");

// ✅ NEW IMPORTS for NFT.Storage + Fetch
const { NFTStorage, File } = require("nft.storage");
const fetch = require("node-fetch");

initializeApp();

// ✅ Environment parameters
const RPC_URL = defineString("BLOCKCHAIN_RPC");
const PRIVATE_KEY = defineString("BLOCKCHAIN_PRIVATE_KEY");
const CONTRACT_ADDRESS = defineString("BLOCKCHAIN_CONTRACT_ADDRESS");

// ✅ NFT.Storage token from Firebase functions config
// Set via: firebase functions:config:set nft.token="YOUR_TOKEN"
const NFT_TOKEN = process.env.NFT_TOKEN || null;

const CONTRACT_ABI = [
  "function anchor(bytes32 _hash, string calldata postId) public returns (bool)",
];

// ✅ Firestore Trigger
exports.onPostUpdate = onDocumentUpdated(
  {
    document: "posts/{postId}",
    region: "asia-south1",
    database: "(default)",
  },
  async (event) => {
    const newData = event.data.after.data();
    const oldData = event.data.before.data();
    const postId = event.params.postId;

    // Only proceed when post crosses 10 upvotes and isn’t already anchored
    if (!oldData.anchored && newData.upvotes >= 10) {
      logger.info(`🚀 Anchoring post ${postId}...`);
      try {
        // ======== 1️⃣ ANCHOR ON BLOCKCHAIN ========
        const provider = new ethers.JsonRpcProvider(RPC_URL.value());
        const wallet = new ethers.Wallet(PRIVATE_KEY.value(), provider);
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS.value(),
          CONTRACT_ABI,
          wallet
        );

        const hash = ethers.id(postId);
        const tx = await contract.anchor(hash, postId);
        await tx.wait();

        logger.info(`✅ Anchored post ${postId} on-chain, tx: ${tx.hash}`);

        // ======== 2️⃣ ARCHIVE TO IPFS VIA NFT.STORAGE ========
        try {
          const nftClient = new NFTStorage({
            token: process.env.NFT_TOKEN || event.app.config.nft?.token || "",
          });

          // Prepare post content
          const postData = {
            id: postId,
            url: newData.url,
            desc: newData.description || "",
            authorId: newData.authorId || "",
            authorName: newData.authorName || "",
            createdAt:
              newData.createdAt || FieldValue.serverTimestamp(),
            upvotes: newData.upvotes || 0,
            downvotes: newData.downvotes || 0,
          };

          const files = [
            new File([JSON.stringify(postData)], "post.json", {
              type: "application/json",
            }),
          ];

          // Attach image if available
          if (newData.imageURL) {
            const res = await fetch(newData.imageURL);
            if (res.ok) {
              const arrayBuffer = await res.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              files.push(
                new File([buffer], "image.jpg", { type: "image/jpeg" })
              );
              logger.info(`🖼️ Added image for post ${postId}`);
            } else {
              logger.warn(
                `⚠️ Failed to fetch image for post ${postId}: ${res.status}`
              );
            }
          }

          // Upload files to IPFS
          const cid = await nftClient.storeDirectory(files);
          logger.info(`📦 Archived post ${postId} to IPFS: ${cid}`);

          // ======== 3️⃣ UPDATE FIRESTORE ========
          const db = getFirestore();
          await db.collection("posts").doc(postId).update({
            anchored: true,
            anchorTx: tx.hash,
            archived: true,
            archivedAt: FieldValue.serverTimestamp(),
            decentralized: {
              provider: "nft.storage",
              cid: cid,
            },
          });

          logger.info(
            `✅ Firestore updated with anchor + IPFS info for post ${postId}`
          );
        } catch (err) {
          logger.error(`❌ IPFS archival failed for ${postId}:`, err);
        }
      } catch (err) {
        logger.error("❌ Blockchain anchoring failed:", err);
      }
    } else {
      logger.debug(
        `ℹ️ Skipping post ${postId} — already anchored or below 10 upvotes`
      );
    }
  }
);
