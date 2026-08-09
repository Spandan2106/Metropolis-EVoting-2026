# 🏛️ Metropolis EVoting 2026: Sovereign Voting Protocol

Metropolis EVoting 2026 is a high-security, blockchain-inspired electronic voting platform designed for the sovereign Smart-City enclave of Metropolis. Built with **TypeScript** on the **MERN** stack (MongoDB, Express, React, Node.js), it ensures electoral integrity through cryptographic hashing, immutable audit logs, and real-time consensus monitoring.



## 🚀 Core Features

### 🔗 Blockchain-Inspired Ledger
- **Immutable Blocks**: Every vote is encapsulated in a block containing an index, timestamp, vote data, and the hash of the previous block.
- **SHA-256 Security**: Uses industry-standard cryptographic hashing to ensure that any tampering with a single vote invalidates the entire chain.
- **Chain Explorer**: A public-facing (or admin-restricted) viewer to inspect the block height and verification status in real-time.

### 👤 Identity & Role-Based Access (RBAC)
- **Multi-Tiered Roles**: Distinct interfaces for **Voters** (Citizens), **Candidates**, **Delegates** (Weighted voting), and **Administrators** (MCEC Authority).
- **Identity Verification**: Multi-step registration involving "Citizen Social Index" (Verification IDs) and "Identity Access Keys" (Passwords).
- **Security Throttling**: Automatic account banning after 10 failed login attempts to prevent brute-force attacks.

### 📡 Real-Time Protocol
- **Server-Sent Events (SSE)**: Live synchronization of audit logs, system-wide broadcasts, and result updates without page refreshes.
- **Dynamic Notifications**: Admin-triggered global alerts for protocol changes or emergency updates.

### 🔒 Privacy-First Design
- **Encrypted Results**: Vote counts are hidden from all users—including administrators—until the "Consensus" is officially published.
- **Anonymous Casting**: Biometric data is decoupled from the vote block using cryptographic hashing; participation is visible, but selection remains private.

---

## 🛠️ Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, SCSS |
| **State/UI** | Framer Motion, Lucide React, Recharts |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Communication**| Server-Sent Events (SSE) |
| **Security** | Crypto (SHA-256), Express-Rate-Limit |

---

## 💻 Installation & Local Setup

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB Atlas** account (or local MongoDB instance)

### 2. Clone and Install
```bash
git clone https://github.com/your-repo/metropolis-evoting-2026.git
cd metropolis-evoting-2026
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
You can copy the content from `.env.example`. You **MUST** provide a `MONGODB_URI` for the database to work.

```env
MONGODB_URI="your_mongodb_connection_string"
NODE_ENV="development"
```



### 4. Running the App
```bash
# Install dependencies
npm install
# Build and start the application
npm run build
npm run start
```
The app will be available at `http://localhost:3000`.

---

## 🍃 MongoDB Implementation

The application is fully integrated with MongoDB Atlas. All data (Users, Candidates, Blocks, Audit Logs, Notifications) is stored in your cluster.

### Setup Steps:
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new Cluster (the "Free Tier" is fine).
3. Go to **Database Access** and create a user with a password.
4. Go to **Network Access** and select "Allow Access From Anywhere" (IP `0.0.0.0/0`).
5. Click **Connect** on your cluster, select "Drivers" (Node.js), and copy the connection string.
6. Paste the string into your `.env` file as `MONGODB_URI`.

---

## 🚀 Deployment (Live Link)

To get a live link for your website, you can use **Render** or **Vercel**.

### Render (Recommended for Full-Stack)
Render is highly recommended because it supports **Server-Sent Events (SSE)** and long-running Node.js processes, which are required for the real-time blockchain audit logs.

**Steps for Render:**
1. Push your code to a GitHub repository.
2. Sign in to [Render](https://render.com/).
3. Click **New** -> **Web Service**.
4. Connect your GitHub repository.
5. **Runtime**: Node
6. **Build Command**: `npm install && npm run build`
7. **Start Command**: `npm run start`
8. **Environment Variables**: Go to the **Environment** tab and add:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `NODE_ENV`: Set this to `production`.
9. **Retrieve Link**: The live URL is displayed at the **top of your Render dashboard** (e.g., `https://metropolis-evoting-2026.onrender.com`).
10. **Wait for Green**: The link becomes active once the status changes to "Live" in the deployment logs.

### Vercel
Vercel is best for pure frontends. Because this app uses an Express backend with SSE for real-time data, Vercel's serverless architecture may cause connection timeouts. If using Vercel, ensure your `MONGODB_URI` is added to the project environment variables.

## 🔄 Resetting for New Tests

If you want to clear the election board to perform a new test run:

### Using the Admin UI (Recommended)
1. Log in as **Admin** (`id: admin123`, `psw: admin`).
2. Go to the **Authority Hub**.
3. Scroll to the bottom of the sidebar and click **"Emergency Protocol Reset"**.
4. This will:
    - Delete all cast votes.
    - Reset all users so they can vote again.
    - Clear the audit logs and real-time alerts.
    - Set Voting to **Open** and Results to **Unpublished**.

### Using the Terminal
You can also trigger a reset by sending a POST request to the API:

```bash
curl -X POST http://localhost:3000/api/admin/reset-election \
     -H "Content-Type: application/json" \
     -d '{"password": "admin"}'
```

---

## 🔒 Security & Privacy Notes
- **Admin Privacy**: Admins cannot see active vote counts while polling is open to prevent bias.
- **Hash Protection**: Cryptographic hashes are redacted in some views to prioritize readability and system security.
- **Audit Logs**: Every critical action is recorded in a tamper-evident audit log stored in MongoDB.
