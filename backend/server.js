const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || "yt834434@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin1234";

app.use(cors());
app.use(express.json());

// In-memory store
const db = {
  users: [],
  wallets: [],
  withdrawals: [],
};

function timestamp() {
  return new Date().toISOString();
}

// user login
app.post("/user", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });
  const existing = db.users.find(u => u.email === email);
  if (!existing) {
    db.users.push({ email, createdAt: timestamp() });
  }
  console.log("/user", email);
  res.json({ status: "user saved" });
});

// wallet connect
app.post("/wallet", (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "address required" });
  const existing = db.wallets.find(w => w.address === address);
  if (!existing) {
    db.wallets.push({ address, connectedAt: timestamp() });
  }
  console.log("/wallet", address);
  res.json({ status: "wallet linked" });
});

// withdraw request
app.post("/withdraw", (req, res) => {
  const { wallet, amount } = req.body;
  if (!amount) return res.status(400).json({ error: "amount required" });
  const entry = { id: db.withdrawals.length + 1, wallet: wallet || "unknown", amount, status: "pending", requestedAt: timestamp() };
  db.withdrawals.push(entry);
  console.log("/withdraw", entry);
  res.json({ status: "pending", wallet, amount });
});

// admin login
app.post("/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    res.json({ success: true, token: Buffer.from(ADMIN_EMAIL + ":" + ADMIN_PASSWORD).toString("base64") });
  } else {
    res.status(401).json({ success: false, error: "Wrong email or password" });
  }
});

// admin middleware
function adminAuth(req, res, next) {
  const auth = req.headers["x-admin-token"];
  if (!auth || Buffer.from(auth, "base64").toString() !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// admin data
app.get("/admin/data", adminAuth, (req, res) => {
  res.json({
    stats: {
      totalUsers: db.users.length,
      totalWallets: db.wallets.length,
      totalWithdrawals: db.withdrawals.length,
      pendingWithdrawals: db.withdrawals.filter(w => w.status === "pending").length,
      totalAmount: db.withdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0).toFixed(2),
    },
    users: db.users,
    wallets: db.wallets,
    withdrawals: db.withdrawals,
  });
});

// admin update withdrawal status
app.patch("/admin/withdraw/:id", adminAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const entry = db.withdrawals.find(w => w.id === id);
  if (!entry) return res.status(404).json({ error: "Not found" });
  entry.status = status;
  res.json({ success: true, entry });
});

app.get("/", (req, res) => res.send("Game Earn backend running"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  
