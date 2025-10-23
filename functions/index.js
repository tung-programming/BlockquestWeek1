/**
 * functions/index.js
 * Automated anchoring + archival (metadata-only, no images).
 *
 * Requirements in functions/.env or cloud functions env:
 * - BLOCKCHAIN_RPC
 * - BLOCKCHAIN_PRIVATE_KEY
 * - BLOCKCHAIN_CONTRACT_ADDRESS
 * - NFT_TOKEN          (Web3.Storage)
 * - PINATA_JWT         (Pinata JWT, optional but recommended)
 * - VOTE_THRESHOLD     (default 10)
 *
 * Notes:
 * - This file preserves createdAt on the post so feeds ordered by createdAt still include archived posts.
 * - The metadata uploaded to IPFS will include snapshotText (trimmed), headers, redirectChain, status, snapshotHtmlHash.
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

// dynamic fetch for Node runtime compatibility
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

// init firebase admin
initializeApp();

// ENV
const RPC_URL = process.env.BLOCKCHAIN_RPC || "";
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || "";
const CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || "";
const NFT_TOKEN = process.env.NFT_TOKEN || "";
const PINATA_JWT = process.env.PINATA_JWT || "";
const VOTE_THRESHOLD = parseInt(process.env.VOTE_THRESHOLD || "10", 10);

const CONTRACT_ABI = [
  "function anchor(bytes32 _hash, string calldata postId) public returns (bool)"
];

// small helper: sha256 hex with 0x prefix
function sha256Hex(bufferOrStr) {
  const buf = Buffer.isBuffer(bufferOrStr) ? bufferOrStr : Buffer.from(String(bufferOrStr));
  return "0x" + crypto.createHash("sha256").update(buf).digest("hex");
}

// trim string to n bytes safely
function trimToBytes(str = "", bytes = 8192) {
  const buf = Buffer.from(str);
  if (buf.length <= bytes) return str;
  return buf.slice(0, bytes).toString("utf8") + "...[truncated]";
}

exports.onPostUpdate = onDocumentUpdated(
  { document: "posts/{postId}", region: "asia-south1" },
  async (event) => {
    const db = getFirestore();
    const newData = event.data.after.data();
    const oldData = event.data.before.data();
    const postId = event.params.postId;

    // Only run when crossing threshold and not already anchored
    if (!oldData?.anchored && (newData?.upvotes || 0) >= VOTE_THRESHOLD) {
      logger.info `🚀 Anchoring and archiving post ${postId}...`;
      try {
        // 1) Anchor on-chain
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

        const hash = ethers.id(postId);
        const tx = await contract.anchor(hash, postId);
        await tx.wait();
        logger.info(`✅ Anchored post ${postId}, tx: ${tx.hash}`);

        // 2) Snapshot fetch the target URL (server-side) to capture evidence
        let snapshotText = "";
        let httpStatus = null;
        let headers = {};
        let finalUrl = newData.url || "";
        let redirectChain = [];

        try {
          const res = await fetch(newData.url, { redirect: "follow", timeout: 15000 });
          httpStatus = res.status;
          // gather headers of interest
          res.headers.forEach((v, k) => {
            headers[k] = v;
          });
          finalUrl = res.url || finalUrl;
          // redirectChain is not directly exposed by fetch; attempt to reconstruct from headers/location or use finalUrl
          // We'll set redirectChain as [original, final]
          redirectChain = [newData.url, finalUrl];

          const text = await res.text();
          snapshotText = trimToBytes(text, 8 * 1024); // first 8KB
        } catch (fetchErr) {
          logger.warn(`⚠️ Snapshot fetch failed for ${postId}: ${fetchErr?.message || fetchErr}`);
          // keep snapshotText empty, but proceed — archival still useful (with description)
        }

        // 3) Build metadata (no image)
        const metadata = {
          postId,
          url: newData.url || "",
          description: newData.description || "",
          authorId: newData.authorId || "",
          authorName: newData.authorName || "Anonymous",
          reportedAt: newData.createdAt?.toDate ? newData.createdAt.toDate().toISOString() : (newData.createdAt || new Date().toISOString()),
          httpStatus,
          redirectChain,
          headers,
          snapshotText,
          snapshotHtmlHash: snapshotText ? sha256Hex(snapshotText) : null,
          upvotes: newData.upvotes || 0,
          downvotes: newData.downvotes || 0,
          anchored: true,
          anchorTx: tx.hash,
          archivedAt: new Date().toISOString()
        };

        // compute evidenceHash (hash of the JSON metadata)
        const evidenceHash = sha256Hex(JSON.stringify(metadata));
        metadata.evidenceHash = evidenceHash;

        // prepare upload: single metadata.json
        const files = [new File([JSON.stringify(metadata, null, 2)], "metadata.json")];

        // 4) upload primary -> Web3.Storage
        let cid = null;
        const w3 = new Web3Storage({ token: NFT_TOKEN });
        try {
          logger.info(`📦 Uploading metadata.json to Web3.Storage for ${postId}...`);
          cid = await w3.put(files, { wrapWithDirectory: false });
          logger.info(`✅ Web3.Storage CID: ${cid}`);
        } catch (w3err) {
          logger.warn(`❌ Web3.Storage upload failed: ${w3err?.message || w3err}`);
          // fallback -> Pinata
          if (!PINATA_JWT) {
            // Record error and bail (but keep anchored true with anchorTx saved)
            logger.error("❌ No PINATA_JWT available; cannot fallback.");
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
            // pinFileToIPFS by Pinata
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

        // 5) build gateway links & store minimal doc (preserving createdAt)
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
          createdAt: newData.createdAt || FieldValue.serverTimestamp(), // preserve createdAt for ordering in feeds
        };

        // Overwrite doc but keep createdAt by setting it in minimalData
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
      }
    } else {
      logger.debug(`ℹ️ Skipping post ${postId} — below threshold or already anchored.`);
    }
  }
);
