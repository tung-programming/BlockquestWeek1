const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { ethers } = require("ethers");

initializeApp();

// ✅ NEW UPPERCASE KEYS
const RPC_URL = defineString("BLOCKCHAIN_RPC");
const PRIVATE_KEY = defineString("BLOCKCHAIN_PRIVATE_KEY");
const CONTRACT_ADDRESS = defineString("BLOCKCHAIN_CONTRACT_ADDRESS");

const CONTRACT_ABI = [
  "function anchor(bytes32 _hash, string calldata postId) public returns (bool)"
];

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

    if (!oldData.anchored && newData.upvotes >= 10) {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL.value());
        const wallet = new ethers.Wallet(PRIVATE_KEY.value(), provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS.value(), CONTRACT_ABI, wallet);

        const hash = ethers.id(postId);
        const tx = await contract.anchor(hash, postId);
        await tx.wait();

        await getFirestore().collection("posts").doc(postId).update({
          anchored: true,
          anchorTx: tx.hash,
        });
      } catch (err) {
        logger.error("Blockchain anchor failed:", err);
      }
    }
  }
);

