/**
 * PhishBlock — functions/index.js
 * Automated anchoring + archival (metadata-only, no images).
 *
 * Environment Variables Required:
 * - BLOCKCHAIN_RPC
 * - BLOCKCHAIN_PRIVATE_KEY
 * - BLOCKCHAIN_CONTRACT_ADDRESS
 * - NFT_TOKEN          (Web3.Storage)
 * - PINATA_JWT         (Pinata JWT, optional but recommended)
 * - VOTE_THRESHOLD     (default 10)
 */

const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { ethers } = require("ethers");
const { Web3Storage, File } = require("web3.storage");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// dynamic fetch for Node runtime
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Initialize Firebase Admin
initializeApp();

// ENV
const RPC_URL = process.env.BLOCKCHAIN_RPC || "";
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || "";
const CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || "";
const NFT_TOKEN = process.env.NFT_TOKEN || "";
const PINATA_JWT = process.env.PINATA_JWT || "";
const VOTE_THRESHOLD = parseInt(process.env.VOTE_THRESHOLD || "10", 10);

// Contract ABI
const CONTRACT_ABI = [
  "function anchor(bytes32 _hash, string calldata postId) public returns (bool)"
];

// Helpers
function sha256Hex(bufferOrStr) {
  const buf = Buffer.isBuffer(bufferOrStr) ? bufferOrStr : Buffer.from(String(bufferOrStr));
  return "0x" + crypto.createHash("sha256").update(buf).digest("hex");
}

function trimToBytes(str = "", bytes = 8192) {
  const buf = Buffer.from(str);
  if (buf.length <= bytes) return str;
  return buf.slice(0, bytes).toString("utf8") + "...[truncated]";
}

// ==============================
// Firestore Trigger Function
// ==============================
exports.onPostUpdate = onDocumentUpdated(
  { document: "posts/{postId}", region: "asia-south1" },
  async (event) => {
    const db = getFirestore();
    const newData = event.data.after.data();
    const oldData = event.data.before.data();
    const postId = event.params.postId;

    // 🛑 Guard — prevent re-triggering after cleanup
    if (newData?.anchored || newData?.anchoringInProgress) {
      logger.debug(`🛑 Skipping ${postId} — already anchored or processing.`);
      return;
    }

    // ✅ Only run when crossing upvote threshold
    if (!oldData?.anchored && (newData?.upvotes || 0) >= VOTE_THRESHOLD) {
      logger.info(`🚀 Anchoring and archiving post ${postId}...`);
      try {
        // Mark as in-progress (to block concurrent triggers)
        await db.collection("posts").doc(postId).update({
          anchoringInProgress: true,
          anchoringStartedAt: FieldValue.serverTimestamp(),
        });

        // 1️⃣ Anchor on-chain
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

        const hash = ethers.id(postId);
        const tx = await contract.anchor(hash, postId);
        await tx.wait();
        logger.info(`✅ Anchored post ${postId}, tx: ${tx.hash}`);

        // 2️⃣ Snapshot fetch for evidence
        let snapshotText = "";
        let httpStatus = null;
        let headers = {};
        let finalUrl = newData.url || "";
        let redirectChain = [];

        try {
          const res = await fetch(newData.url, { redirect: "follow", timeout: 15000 });
          httpStatus = res.status;
          res.headers.forEach((v, k) => (headers[k] = v));
          finalUrl = res.url || finalUrl;
          redirectChain = [newData.url, finalUrl];
          const text = await res.text();
          snapshotText = trimToBytes(text, 8 * 1024);
        } catch (fetchErr) {
          logger.warn(`⚠️ Snapshot fetch failed for ${postId}: ${fetchErr?.message || fetchErr}`);
        }

        // 3️⃣ Fetch full Firestore data for metadata completeness
        const fullDoc = await db.collection("posts").doc(postId).get();
        const fullData = fullDoc.exists ? fullDoc.data() : newData;

        // 4️⃣ Build metadata (permanent record)
        const metadata = {
          postId,
          url: fullData.url || "",
          description: fullData.description?.trim() || "No description provided.",
          authorId: fullData.authorId || "",
          authorName: fullData.authorName?.trim() || "Unknown",
          reportedAt: fullData.createdAt?.toDate
            ? fullData.createdAt.toDate().toISOString()
            : (fullData.createdAt || new Date().toISOString()),
          httpStatus,
          redirectChain,
          headers,
          snapshotText,
          snapshotHtmlHash: snapshotText ? sha256Hex(snapshotText) : null,
          upvotes: fullData.upvotes || 0,
          downvotes: fullData.downvotes || 0,
          anchored: true,
          anchorTx: tx.hash,
          archivedAt: new Date().toISOString(),
        };

        const evidenceHash = sha256Hex(JSON.stringify(metadata));
        metadata.evidenceHash = evidenceHash;

        logger.info(`🧾 Final metadata for ${postId}:`, metadata);

        // 5️⃣ Upload metadata to IPFS (Web3.Storage → Pinata fallback)
        let cid = null;
        const w3 = new Web3Storage({ token: NFT_TOKEN });
        try {
          logger.info(`📦 Uploading metadata.json to Web3.Storage for ${postId}...`);
          const files = [new File([JSON.stringify(metadata, null, 2)], "metadata.json")];
          cid = await w3.put(files, { wrapWithDirectory: false });
          logger.info(`✅ Web3.Storage CID: ${cid}`);
        } catch (w3err) {
          logger.warn(`❌ Web3.Storage upload failed: ${w3err?.message || w3err}`);
          if (!PINATA_JWT) {
            await db.collection("posts").doc(postId).update({
              anchored: true,
              anchorTx: tx.hash,
              anchoringError: true,
              lastError: `Web3.Storage failed: ${w3err?.message || w3err}`,
              lastErrorAt: FieldValue.serverTimestamp(),
            });
            return;
          }
          try {
            logger.info(`🔁 Attempting Pinata fallback for ${postId}...`);
            const tempPath = path.join("/tmp", `${postId}-metadata.json`);
            fs.writeFileSync(tempPath, JSON.stringify(metadata, null, 2), "utf8");
            const form = new FormData();
            form.append("file", fs.createReadStream(tempPath));
            const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
              method: "POST",
              headers: { Authorization: `Bearer ${PINATA_JWT}` },
              body: form,
            });
            const data = await res.json();
            fs.unlinkSync(tempPath);
            if (!res.ok || !data.IpfsHash) {
              throw new Error("Pinata upload failed: " + JSON.stringify(data));
            }
            cid = data.IpfsHash;
            logger.info(`✅ Pinata CID: ${cid}`);
          } catch (pinErr) {
            logger.error(`❌ Pinata fallback also failed: ${pinErr?.message || pinErr}`);
            await db.collection("posts").doc(postId).update({
              anchored: true,
              anchorTx: tx.hash,
              anchoringError: true,
              lastError: `Web3.Storage: ${w3err?.message || w3err} | Pinata: ${pinErr?.message || pinErr}`,
              lastErrorAt: FieldValue.serverTimestamp(),
            });
            return;
          }
        }

        // 6️⃣ Store minimal blockchain + IPFS info
        const ipfsGateway = `https://gateway.pinata.cloud/ipfs/${cid}`;
        const ipfsMetadata = `${ipfsGateway}/metadata.json`;
        const backupLink = `https://w3s.link/ipfs/${cid}`;
        const anchorTxUrl = `https://amoy.polygonscan.com/tx/${tx.hash}`;

        const minimalData = {
          url: newData.url || "",
          anchored: true,
          anchorTx: tx.hash,
          anchorTxUrl,
          archiveCid: cid,
          ipfsGateway,
          ipfsMetadata,
          backupLink,
          evidenceHash,
          archivedAt: FieldValue.serverTimestamp(),
          upvotes: newData.upvotes || 0,
          downvotes: newData.downvotes || 0,
          createdAt: newData.createdAt || FieldValue.serverTimestamp(),
        };

        await db.collection("posts").doc(postId).set(minimalData, { merge: false });

        logger.info(`🧹 Firestore cleaned & updated for post ${postId} (cid: ${cid})`);
      } catch (err) {
        logger.error(`❌ Error processing post ${postId}: ${err?.message || err}`);
        try {
          await getFirestore().collection("posts").doc(postId).update({
            anchoringError: true,
            lastError: err?.message || "Unknown error",
            lastErrorAt: FieldValue.serverTimestamp(),
          });
        } catch (uerr) {
          logger.error("❌ Failed to mark anchoringError on Firestore:", uerr?.message || uerr);
        }
      } finally {
        // Remove in-progress flag
        await db.collection("posts").doc(postId).update({
          anchoringInProgress: false,
        });
      }
    } else {
      logger.debug(`ℹ️ Skipping post ${postId} — below threshold or already anchored.`);
    }
  }
);

exports.safeTools = require("./safeTools").safeTools;

