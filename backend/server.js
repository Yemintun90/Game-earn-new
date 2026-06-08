const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || "yt834434@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin1234";

app.use(cors());
app.use(express.json());

// ဒေတာတွေ ဖုန်းထဲမှာ အမြဲရှိနေအောင် db.json ဖိုင်ဖြင့် သိမ်းဆည်းမည့်လမ်းကြောင်း
const DB_FILE = path.join(__dirname, "db.json");

// ဒေတာများကို ဖိုင်ထဲမှ ဖတ်ယူခြင်း
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialDB = { users: [], wallets: [], withdrawals: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2));
    return initialDB;
  }
  try {
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (e) {
    return { users: [], wallets: [], withdrawals: [] };
  }
}

// ဒေတာများကို ဖိုင်ထဲသို့ သိမ်းဆည်းခြင်း
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function timestamp() {
  return new Date().toISOString();
}

// 1. USER SIGNUP (အကောင့်အသစ်ဖွင့်ရန်)
app.post("/api/user/signup", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const db = loadDB();
  const existing = db.users.find(u => u.email === email);
  if (existing) return res.status(400).json({ error: "Email already exists" });

  const newUser = { email, password, createdAt: timestamp() };
  db.users.push(newUser);
  saveDB(db);

  console.log("User Signed Up:", email);
  res.json({ success: true, status: "User registered successfully" });
});

// 2. USER LOGIN (အသုံးပြုသူများ Login ဝင်ရန်)
app.post("/api/user/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const db = loadDB();
  const user = db.users.find(u => u.email === email && u.password === password);
  
  if (user) {
    // User အတွက် Token အား Base64 ပြောင်း၍ ထုတ်ပေးခြင်း
    const userToken = Buffer.from(email).toString("base64");
    res.json({ success: true, token: userToken, email: user.email });
  } else {
    res.status(401).json({ success: false, error: "Wrong email or password" });
  }
});

// 3. WALLET CONNECT
app.post("/wallet", (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "address required" });
  
  const db = loadDB();
  const existing = db.wallets.find(w => w.address === address);
  if (!existing) {
    db.wallets.push({ address, connectedAt: timestamp() });
    saveDB(db);
  }
  console.log("/wallet", address);
  res.json({ status: "wallet linked" });
});

// 4. WITHDRAW REQUEST
app.post("/withdraw", (req, res) => {
  const { wallet, amount } = req.body;
  if (!amount) return res.status(400).json({ error: "amount required" });
  
  const db = loadDB();
  const entry = { id: db.withdrawals.length + 1, wallet: wallet || "unknown", amount, status: "pending", requestedAt: timestamp() };
  db.withdrawals.push(entry);
  saveDB(db);
  
  console.log("/withdraw", entry);
  res.json({ status: "pending", wallet, amount });
});

// 5. ADMIN LOGIN (ဝင်မရဖြစ်နေသည့် Token Error ပြင်ဆင်ပြီး)
app.post("/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // Admin Token ကို သတ်သတ်မှတ်မှတ် ပုံသေထုတ်ပေးလိုက်ခြင်း
    const token = Buffer.from(ADMIN_EMAIL + ":" + ADMIN_PASSWORD).toString("base64");
    res.json({ success: true, token: token });
  } else {
    res.status(401).json({ success: false, error: "Wrong email or password" });
  }
});

// ADMIN AUTH MIDDLEWARE (Token စစ်ဆေးသည့်စနစ် ပြင်ဆင်ပြီး)
function adminAuth(req, res, next) {
  const auth = req.headers["x-admin-token"];
  const expectedToken = Buffer.from(ADMIN_EMAIL + ":" + ADMIN_PASSWORD).toString("base64");
  
  if (!auth || auth !== expectedToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// 6. ADMIN DATA GET
app.get("/admin/data", adminAuth, (req, res) => {
  const db = loadDB();
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

// 7. ADMIN UPDATE WITHDRAW STATUS
app.patch("/admin/withdraw/:id", adminAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  
  const db = loadDB();
  const entry = db.withdrawals.find(w => w.id === id);
  if (!entry) return res.status(404).json({ error: "Not found" });
  
  entry.status = status;
  saveDB(db);
  res.json({ success: true, entry });
});

app.get("/", (req, res) => res.send("Game Earn backend running with Local Database JSON"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
                                             
