/**
 * manualArchive.js
 * Manual archive script for PhishBlock posts.
 * Uploads metadata to Web3.Storage (primary) and falls back to Pinata (secondary).
 *
 * Usage:
 *   node manualArchive.js <postId>
 *
 * Requirements:
 * - .env must contain NFT_TOKEN and PINATA_JWT
 * - serviceAccount.json (Firebase Admin service account) must be in the same folder
 * - package.json should have "type": "module"
 *
 * Notes:
 * - This version avoids `import ... assert { type: "json" }` (which can error on some Node builds)
 *   by reading serviceAccount.json with fs and JSON.parse. That resolves the "Unexpected identifier 'assert'"
 *   error you hit on Node v22.x.
 */

import dotenv from "dotenv";
import fetch from "node-fetch";
import { Web3Storage, File } from "web3.storage";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import FormData from "form-data";

// load .env
dotenv.config();

// ---- Read and parse serviceAccount.json (avoid `assert { type: "json" }` usage) ----
const serviceAccountPath = path.resolve(process.cwd(), "serviceAccount.json");
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ serviceAccount.json not found in current directory:", serviceAccountPath);
  process.exit(1);
}

let serviceAccount;
try {
  const raw = fs.readFileSync(serviceAccountPath, { encoding: "utf8" });
  serviceAccount = JSON.parse(raw);
} catch (err) {
  console.error("❌ Failed to read/parse serviceAccount.json:", err.message || err);
  process.exit(1);
}

// initialize Firebase Admin
try {
  initializeApp({
    credential: cert(serviceAccount),
  });
} catch (err) {
  console.error("❌ Firebase initialization error:", err.message || err);
  process.exit(1);
}

const db = getFirestore();

// ---- Credentials for Web3.Storage and Pinata ----
const NFT_TOKEN = process.env.NFT_TOKEN || "";
const PINATA_JWT = process.env.PINATA_JWT || "";

if (!NFT_TOKEN) {
  console.error("❌ Missing NFT_TOKEN in .env (Web3.Storage token)");
  process.exit(1);
}
// PINATA_JWT is optional only if you want fallback to Pinata
if (!PINATA_JWT) {
  console.warn("⚠️ PINATA_JWT not found in .env — Pinata fallback will be unavailable.");
}

// create web3.storage client
const w3Client = new Web3Storage({ token: NFT_TOKEN });

// helper: convert object -> web3.storage File
function makeFileFromObject(obj, name) {
  const buffer = Buffer.from(JSON.stringify(obj, null, 2));
  return new File([buffer], name);
}

// helper: sleep (used for small delays if desired)
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// main
async function main() {
  const postId = process.argv[2];
  if (!postId) {
    console.error("Usage: node manualArchive.js <postId>");
    process.exit(1);
  }

  // fetch post doc
  const postRef = db.collection("posts").doc(postId);
  const doc = await postRef.get();

  if (!doc.exists) {
    console.error(`❌ Post ${postId} not found in Firestore (collection: posts)`);
    process.exit(1);
  }

  const post = doc.data();
  console.log(`🔎 Post found: ${postId}`);
  console.log(`   anchored: ${!!post.anchored} | upvotes: ${post.upvotes ?? 0} | archived: ${!!post.archived}`);

  // prepare metadata
  const metadata = {
    postId,
    author: post.authorName ?? post.author ?? "unknown",
    description: post.description ?? "",
    url: post.url ?? "",
    image: post.imageURL ?? "",
    upvotes: post.upvotes ?? 0,
    anchored: !!post.anchored,
    anchorTx: post.anchorTx ?? null,
    timestamp: post.createdAt ? (post.createdAt.toDate ? post.createdAt.toDate() : post.createdAt) : new Date().toISOString(),
  };

  // try Web3.Storage first
  let cid = null;
  try {
    console.log("📦 Uploading metadata to Web3.Storage...");
    const file = makeFileFromObject(metadata, `${postId}.json`);
    cid = await w3Client.put([file], { wrapWithDirectory: false }); // returns CID
    console.log("✅ Web3.Storage upload success. CID:", cid);
  } catch (w3err) {
    console.error("❌ Web3.Storage upload failed:", w3err?.message ?? w3err);
    // attempt Pinata fallback if available
    if (!PINATA_JWT) {
      console.error("❌ No PINATA_JWT available — cannot use Pinata fallback. Updating Firestore with error.");
      await postRef.update({
        anchoringError: true,
        lastError: `Web3.Storage failed: ${w3err?.message ?? w3err}`,
        lastErrorAt: new Date(),
      });
      process.exit(1);
    }

    console.log("🔁 Attempting Pinata fallback...");

    try {
      // write temp file
      const tempFilePath = path.join(process.cwd(), `${postId}-metadata.json`);
      fs.writeFileSync(tempFilePath, JSON.stringify(metadata, null, 2), "utf8");

      const form = new FormData();
      form.append("file", fs.createReadStream(tempFilePath), {
        filename: "metadata.json",
      });

      // pinFileToIPFS expects JWT or API key/secret. We use JWT via Authorization header.
      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          // NOTE: Do NOT set content-type header — form-data will set it including boundary
        },
        body: form,
      });

      const result = await res.json();
      // remove temp file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        // non-fatal
      }

      if (!res.ok || !result.IpfsHash) {
        throw new Error(`Pinata error: ${JSON.stringify(result)}`);
      }

      cid = result.IpfsHash;
      console.log("✅ Pinata upload success. CID:", cid);
    } catch (pinErr) {
      console.error("❌ Pinata fallback also failed:", pinErr?.message ?? pinErr);
      await postRef.update({
        anchoringError: true,
        lastError: `Web3.Storage: ${w3err?.message ?? w3err} | Pinata: ${pinErr?.message ?? pinErr}`,
        lastErrorAt: new Date(),
      });
      process.exit(1);
    }
  }

  // update Firestore with archive info
  if (cid) {
    const updatePayload = {
      archived: true,
      archiveCid: cid,
      archivedAt: new Date(),
      anchoringError: false,
      lastError: "",
    };

    try {
      await postRef.update(updatePayload);
      console.log(`📚 Firestore updated for post ${postId}`);
      console.log(`   IPFS gateways: https://gateway.pinata.cloud/ipfs/${cid}  |  https://w3s.link/ipfs/${cid}`);
    } catch (uerr) {
      console.error("❌ Failed to update Firestore:", uerr?.message ?? uerr);
      process.exit(1);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Unhandled error:", err?.message ?? err);
  process.exit(1);
});
