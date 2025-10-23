/**
 * ✅ PhishBlock — Automated Archival & Cleanup
 * Anchors verified phishing reports to Polygon and archives to IPFS
 * with Web3.Storage + Pinata fallback and Firestore cleanup.
 */

const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { ethers } = require("ethers");
const { Web3Storage, File } = require("web3.storage");
// ⚙️ Universal fetch fix for Firebase Node runtimes
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

// 🧩 Initialize Firebase Admin
initializeApp();

// ====== 🔧 ENVIRONMENT VARIABLES ======
const RPC_URL = process.env.BLOCKCHAIN_RPC || "";
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || "";
const CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || "";
const NFT_TOKEN = process.env.NFT_TOKEN || "";
const PINATA_JWT = process.env.PINATA_JWT || "";
const VOTE_THRESHOLD = parseInt(process.env.VOTE_THRESHOLD || "10", 10);

const CONTRACT_ABI = [
  "function anchor(bytes32 _hash, string calldata postId) public returns (bool)",
];

// ====== 🔥 FIRESTORE TRIGGER ======
exports.onPostUpdate = onDocumentUpdated(
  {
    document: "posts/{postId}",
    region: "asia-south1",
  },
  async (event) => {
    const db = getFirestore();
    const newData = event.data.after.data();
    const oldData = event.data.before.data();
    const postId = event.params.postId;

    if (!oldData.anchored && (newData.upvotes || 0) >= VOTE_THRESHOLD) {
      logger.info(`🚀 Anchoring and archiving post ${postId}...`);

      try {
        // 1️⃣ Blockchain anchoring
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

        const hash = ethers.id(postId);
        const tx = await contract.anchor(hash, postId);
        await tx.wait();
        logger.info(`✅ Anchored post ${postId}, tx: ${tx.hash}`);

        // 2️⃣ Prepare metadata
        const metadata = {
          postId,
          url: newData.url || "",
          upvotes: newData.upvotes || 0,
          downvotes: newData.downvotes || 0,
          anchored: true,
          anchorTx: tx.hash,
          createdAt: newData.createdAt || new Date().toISOString(),
        };

        // Fetch image for IPFS
        let imageBuffer = null;
        if (newData.imageURL) {
          try {
            const imgRes = await fetch(newData.imageURL);
            if (imgRes.ok) {
              imageBuffer = Buffer.from(await imgRes.arrayBuffer());
            }
          } catch (e) {
            logger.error(`⚠️ Failed to fetch image for ${postId}:`, e);
          }
        }

        const files = [new File([JSON.stringify(metadata, null, 2)], "metadata.json")];
        if (imageBuffer) {
          files.push(new File([imageBuffer], "proof.jpg"));
        }

        // 3️⃣ Upload to Web3.Storage (primary)
        const client = new Web3Storage({ token: NFT_TOKEN });
        let cid = null;

        try {
          cid = await client.put(files, { wrapWithDirectory: false });
          logger.info(`📦 Uploaded to Web3.Storage: ${cid}`);
        } catch (err) {
          logger.error(`❌ Web3.Storage upload failed:`, err);

          // 4️⃣ Fallback to Pinata
          if (!PINATA_JWT) throw new Error("No Pinata JWT provided");
          try {
            const tempFile = path.join("/tmp", `${postId}-metadata.json`);
            fs.writeFileSync(tempFile, JSON.stringify(metadata, null, 2));

            const form = new FormData();
            form.append("file", fs.createReadStream(tempFile));
            const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
              method: "POST",
              headers: { Authorization: `Bearer ${PINATA_JWT}` },
              body: form,
            });
            const data = await res.json();
            fs.unlinkSync(tempFile);

            if (!res.ok || !data.IpfsHash) {
              throw new Error("Pinata upload failed: " + JSON.stringify(data));
            }
            cid = data.IpfsHash;
            logger.info(`✅ Pinata fallback success: ${cid}`);
          } catch (fallbackErr) {
            logger.error(`❌ Both Web3.Storage and Pinata failed:`, fallbackErr);
            await db.collection("posts").doc(postId).update({
              anchored: true,
              anchorTx: tx.hash,
              anchoringError: true,
              lastError: fallbackErr.message,
              lastErrorAt: FieldValue.serverTimestamp(),
            });
            return;
          }
        }

        // 5️⃣ Construct gateway links
        const ipfsGateway = `https://gateway.pinata.cloud/ipfs/${cid}`;
        const backupLink = `https://w3s.link/ipfs/${cid}`;

        // 6️⃣ Cleanup Firestore document
        const minimalData = {
          url: newData.url || "",
          anchored: true,
          anchorTx: tx.hash,
          archiveCid: cid,
          archivedAt: FieldValue.serverTimestamp(),
          ipfsGateway,
          backupLink,
          upvotes: newData.upvotes || 0,
          downvotes: newData.downvotes || 0,
        };

        await db.collection("posts").doc(postId).set(minimalData, { merge: false });

        logger.info(`🧹 Firestore cleaned and updated for post ${postId}`);

      } catch (err) {
        logger.error(`❌ Error in anchoring/archive for ${postId}:`, err);
        await getFirestore().collection("posts").doc(postId).update({
          anchoringError: true,
          lastError: err.message || "Unknown failure",
          lastErrorAt: FieldValue.serverTimestamp(),
        });
      }
    } else {
      logger.debug(`ℹ️ Skipping post ${postId} — below threshold or already anchored.`);
    }
  }
);
