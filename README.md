# 🛡️ PhishBlock — Smart Phishing Intelligence & Archival System

PhishBlock is a full-stack **phishing detection and intelligence dashboard** built with  
**Firebase (Functions + Hosting + Firestore)** and **React + Vite** on the frontend.

It allows users to:
- 🧠 **Report** suspicious URLs  
- ⚙️ **Verify domains** in real-time using Google Safe Browsing API v4 + WHOIS API Ninjas  
- 🔗 **Anchor verified posts** on-chain (Polygon Amoy Testnet)  
- 🧾 **Archive evidence** to IPFS via Web3.Storage / Pinata  

---

## 🚀 Features
- 🔍 **SafeTools** – Real-time phishing intelligence backend (Google Safe Browsing + WHOIS)  
- 🧩 **Anchors** – On-chain verified phishing reports with IPFS backups  
- 🌐 **Domains** – Instant domain verification UI  
- 🧱 **Firebase Functions v2** – Node 22 runtime (Cloud Run 2nd Gen)  
- 🎨 **Frontend** – Vite + React + TailwindCSS + Framer Motion  
- 🔐 **Secure Config** – API keys stored via `firebase functions:config:set`  
- ⚡ **CORS-Safe** backend for localhost + web.app origins  
- 💾 **Firestore Integration** for live feeds  
- 📡 **Responsive UI** – fully mobile ready  

---

## 🧩 Tech Stack
| Layer | Tech |
|:--|:--|
| Frontend | React (Vite), TailwindCSS, Framer Motion |
| Backend | Firebase Functions (Node 22, Cloud Run 2nd Gen) |
| Database | Firestore |
| Blockchain | Polygon Amoy Testnet (ethers.js) |
| Storage | IPFS via Web3.Storage + Pinata |
| APIs | Google Safe Browsing v4, API Ninjas WHOIS |

---

## ⚙️ Installation

```bash
git clone https://github.com/tung-programming/BlockquestWeek1
cd PhishBlock
```


# 🔧 Frontend Setup
```
cd frontend
npm install
npm run dev
```
Runs locally on http://localhost:5173 

# 🧠 Firebase Functions Setup

```
cd ../functions
npm install
```
### Add environment keys
```
firebase functions:config:set \
  safebrowsing.key="YOUR_GOOGLE_SAFE_BROWSING_KEY" \
  whois.apininjas="YOUR_API_NINJAS_KEY" \
  virustotal.key="(future)" \
  urlscan.key="(future)"
```
### Deploy backend
```
firebase deploy --only functions:safeTools
```
## 🏗 Build & Deploy Frontend
```
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```
Live site → https://phishblock-demo.web.app

Functions API → https://safetools-qtxnl6sgzq-el.a.run.app

## Folder Structure
```
TUSHAR-BLOCKQUEST/
├── .firebase/
├── contracts/
│   └── Anchor.sol
|---frontend
|    ├─ .env.local
|    ├─ index.html
|    ├─ package.json
|    ├─ postcss.config.cjs
|    ├─ tailwind.config.cjs
|    ├─ vite.config.js
|    ├─ public
|    │  └─ favicon.ico
|    └─ src
|       ├─ main.jsx
|       ├─ App.jsx
|       ├─ index.css
|       ├─ assets
|       │  └─ (images, icons...)
|       ├─ firebase
|       │  └─ firebase.js
|       ├─ hooks
|       │  ├─ useAuth.jsx
|       │  └─ useBlockchainTx.js
|       ├─ components
|       │  ├─ BackButton.jsx
|       │  ├─ SearchDropdown.jsx
|       │  └─ Feed
|       │     ├─ PostCard.jsx
|       │     ├─ Navbar.jsx
|       │     ├─ PostForm.jsx
|       │     ├─ RightPanel.jsx
|       │     ├─ Sidebar.jsx
|       │     └─ ImageModal.jsx
|       └─ pages
|           ├─ Landing.jsx
|           ├─ FeedPage.jsx
|           ├─ PostDetail.jsx
|           ├─ ProfilePage.jsx
|           ├─ UserProfile.jsx
|           ├─ Login.jsx
|           ├─ Signup.jsx
|           ├─ Domains.jsx
|           ├─ Tools.jsx
|           └─ Anchors.jsx
│
├── functions/
│   ├── node_modules/
│   ├── Screenshots/
│   ├── anchor.js
│   ├── checkTx.js
│   ├── firestore-debug.log
│   ├── index.js
│   ├── manualArchive.js
│   ├── package.json
│   ├── package-lock.json
│   ├── safeBrowsingCheck.js
│   ├── safeTools.js
│   ├── serviceAccount.json
│   └── database.rules.json
│
├── node_modules/
├── public/
│   └── index.html
│
├── .env
├── .env.local
├── .env.phishblock-demo
├── .eslint.cjs
├── .firebaserc
├── .gitignore
├── cors.json
├── database.rules.json
├── firebase.json
├── firestore-debug.log
├── firestore.indexes.json
├── firestore.rules
├── package-lock.json
├── package.json
├── README.md
└── storage.rules

```

## 🧠 Environment Variables
```
Key	                        Description
SAFEBROWSING_KEY	        Google Safe Browsing API key (never expires)
WHOIS_API_NINJAS	        API Ninjas WHOIS key
BLOCKCHAIN_RPC	            Polygon Amoy RPC URL
BLOCKCHAIN_PRIVATE_KEY	    Wallet private key (for anchoring)
NFT_TOKEN	                Web3.Storage token
PINATA_JWT	                Pinata API token
VOTE_THRESHOLD          	Upvote limit before auto-anchor
```
## Disclaimer

My Walllet Address is there in one of the post which i kept for judges.

But rather than running it on localhost , I suggest you all to use the link which i gave. Because there are a lot of api keys and environment variables i am using. 

Link: https://phishblock-demo.web.app

I would love to get your suggestions and improvements that I can do on this app as I am not planning to stop this yet and continue this and make it polished.
Your advise would be really helpful and if any queries relating to variables , please contact me .

Tushar/tung-programming



