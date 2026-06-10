// ===== Browser-only (localStorage) state =====
let wallet = localStorage.getItem("wallet") || "";
let txnCount = parseInt(localStorage.getItem("txnCount") || "0", 10);
let totalEarned = parseFloat(localStorage.getItem("totalEarned") || "0");
let balance = parseFloat(localStorage.getItem("balance") || "0");
let isLoggedIn = false;
let userEmail = "";

// ---- helpers ----
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function getUsers() {
  try { return JSON.parse(localStorage.getItem("users") || "{}"); }
  catch (e) { return {}; }
}
function saveUsers(users) { localStorage.setItem("users", JSON.stringify(users)); }

// Tiny hash so we don't store raw passwords in plain text in localStorage.
function hashPassword(pw) {
  let h = 0;
  for (let i = 0; i < pw.length; i++) { h = (h << 5) - h + pw.charCodeAt(i); h |= 0; }
  return "h" + h.toString(36);
}

function setLoggedInUI(email) {
  isLoggedIn = true;
  userEmail = email;
  document.getElementById('loginBtn').innerHTML = "❌ Logout";
  const emailEl = document.getElementById('statUserEmail');
  if (emailEl) emailEl.textContent = email;
}

function setLoggedOutUI() {
  isLoggedIn = false;
  userEmail = "";
  document.getElementById('loginBtn').innerHTML = "✦ &nbsp; Login / Sign Up";
  const emailEl = document.getElementById('statUserEmail');
  if (emailEl) emailEl.textContent = "Guest User";
}

function refreshStats() {
  const txnEl = document.getElementById("statTxn");
  const earnedEl = document.getElementById("statEarned");
  const balEl = document.getElementById("statBalance");
  if (txnEl) txnEl.textContent = txnCount;
  if (earnedEl) earnedEl.textContent = totalEarned.toFixed(2);
  if (balEl) balEl.textContent = balance.toFixed(2);
}

// ===== Wallet =====
document.getElementById('connectBtn').addEventListener('click', () => {
  openModal('walletModal');
  document.getElementById('walletInput').focus();
});
document.getElementById('walletCancel').addEventListener('click', () => closeModal('walletModal'));

function doConnectWallet(address) {
  if (!address) return;
  wallet = address;
  localStorage.setItem("wallet", wallet);
  document.getElementById("statusText").textContent = "Connected";
  document.getElementById("statusDot").style.background = "#00fff0";
  if (balance === 0) {
    balance = parseFloat((Math.random() * 5 + 1).toFixed(2));
    localStorage.setItem("balance", String(balance));
  }
  refreshStats();
}

document.getElementById('walletConfirmManual').addEventListener('click', () => {
  const addr = document.getElementById('walletInput').value.trim();
  closeModal('walletModal');
  doConnectWallet(addr);
});

// ===== Login / Signup (localStorage) =====
document.getElementById('loginBtn').addEventListener('click', () => {
  if (isLoggedIn) {
    setLoggedOutUI();
    localStorage.removeItem("currentUser");
    return;
  }
  openModal('loginModal');
});
document.getElementById('loginCancel').addEventListener('click', () => closeModal('loginModal'));

// Sign up
document.getElementById('signupConfirmAction').addEventListener('click', () => {
  const email = document.getElementById('emailInput').value.trim().toLowerCase();
  const password = document.getElementById('passwordInput').value;
  if (!email || !password) return alert("ကျေးဇူးပြု၍ အချက်အလက်များ ဖြည့်ပါ");
  if (password.length < 6) return alert("Password အနည်းဆုံး ၆ လုံး ရှိရပါမည်");

  const users = getUsers();
  if (users[email]) return alert("ဤ Email ဖြင့် အကောင့်ရှိပြီးသား ဖြစ်ပါသည်။ Login ဝင်ပါ");

  users[email] = { password: hashPassword(password) };
  saveUsers(users);
  alert("အကောင့်ဖွင့်ခြင်း အောင်မြင်သည်");
  proceedLogin(email, password);
});

// Login
document.getElementById('loginConfirmAction').addEventListener('click', () => {
  const email = document.getElementById('emailInput').value.trim().toLowerCase();
  const password = document.getElementById('passwordInput').value;
  if (!email || !password) return alert("ကျေးဇူးပြု၍ အချက်အလက်များ ဖြည့်ပါ");
  proceedLogin(email, password);
});

function proceedLogin(email, password) {
  const users = getUsers();
  const user = users[email];
  if (!user || user.password !== hashPassword(password)) {
    return alert("Email သို့မဟုတ် Password မှားယွင်းနေပါသည်");
  }
  localStorage.setItem("currentUser", email);
  closeModal('loginModal');
  setLoggedInUI(email);
}

// ===== Play to earn =====
document.getElementById('playBtn').addEventListener('click', () => {
  if (!isLoggedIn) return alert("ကျေးဇူးပြု၍ အရင်ဆုံး Login ဝင်ပေးပါ");
  const reward = parseFloat((Math.random() * 0.3 + 0.1).toFixed(3));
  totalEarned += reward;
  txnCount++;
  balance += reward;
  localStorage.setItem("totalEarned", String(totalEarned));
  localStorage.setItem("txnCount", String(txnCount));
  localStorage.setItem("balance", String(balance));
  refreshStats();
});

// ===== Withdraw =====
document.getElementById('withdrawBtn').addEventListener('click', () => {
  if (!isLoggedIn || !wallet) return alert("Login ဝင်ရန် သို့မဟုတ် Wallet ချိတ်ရန် လိုအပ်ပါသည်");
  openModal('withdrawModal');
});
document.getElementById('withdrawCancel').addEventListener('click', () => closeModal('withdrawModal'));
document.getElementById('withdrawConfirm').addEventListener('click', () => {
  closeModal('withdrawModal');
  balance = 0;
  localStorage.setItem("balance", "0");
  refreshStats();
  alert("Withdraw Request တင်ခြင်း အောင်မြင်ပါသည်");
});

// ===== Game helpers =====
function persistEarnings() {
  localStorage.setItem("totalEarned", String(totalEarned));
  localStorage.setItem("txnCount", String(txnCount));
  localStorage.setItem("balance", String(balance));
  refreshStats();
}

function requireLogin() {
  if (!isLoggedIn) { alert("ကစားရန် အရင်ဆုံး Login ဝင်ပေးပါ"); return false; }
  return true;
}

function showResult(elId, text, won) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = text;
  el.className = "game-result " + (won ? "win" : "lose");
}

// ----- Game tab switching -----
document.querySelectorAll('.game-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.game-tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.game-view').forEach((v) => v.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('game-' + tab.dataset.game).classList.add('active');
  });
});

// ----- 1) Spin Wheel -----
const WHEEL_SEGMENTS = [
  { label: "0.10", value: 0.10, color: "#00fff0" },
  { label: "0.50", value: 0.50, color: "#ff00ff" },
  { label: "0.05", value: 0.05, color: "#ffd700" },
  { label: "1.00", value: 1.00, color: "#00ff88" },
  { label: "0.20", value: 0.20, color: "#00a3ff" },
  { label: "2.00", value: 2.00, color: "#ff5577" },
];
let wheelAngle = 0;
let spinning = false;

(function buildWheel() {
  const wheel = document.getElementById('wheel');
  if (!wheel) return;
  const seg = 360 / WHEEL_SEGMENTS.length;
  const stops = WHEEL_SEGMENTS.map((s, i) => `${s.color} ${i * seg}deg ${(i + 1) * seg}deg`).join(", ");
  wheel.style.background = `conic-gradient(${stops})`;
})();

document.getElementById('spinBtn').addEventListener('click', () => {
  if (!requireLogin() || spinning) return;
  spinning = true;
  const wheel = document.getElementById('wheel');
  const idx = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
  const seg = 360 / WHEEL_SEGMENTS.length;
  // Land pointer (top) on the chosen segment center.
  const target = 360 * 5 + (360 - (idx * seg + seg / 2));
  wheelAngle += target;
  wheel.style.transform = `rotate(${wheelAngle}deg)`;
  showResult('spinResult', "လှည့်နေသည်...", true);
  setTimeout(() => {
    const prize = WHEEL_SEGMENTS[idx].value;
    balance += prize; totalEarned += prize; txnCount++;
    persistEarnings();
    showResult('spinResult', `🎉 +${prize.toFixed(2)} tokens ရရှိသည်!`, true);
    spinning = false;
  }, 4100);
});

// ----- 2) Coin Flip -----
let coinBusy = false;
document.querySelectorAll('#game-coin .choice-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!requireLogin() || coinBusy) return;
    const bet = parseFloat(document.getElementById('coinBet').value);
    if (!bet || bet <= 0) return alert("Bet ပမာဏ ထည့်ပါ");
    if (bet > balance) return alert("Balance မလုံလောက်ပါ");
    coinBusy = true;
    balance -= bet; persistEarnings();
    const coin = document.getElementById('coin');
    coin.classList.add('flipping');
    showResult('coinResult', "လှန်နေသည်...", true);
    setTimeout(() => {
      const result = Math.random() < 0.5 ? "heads" : "tails";
      document.getElementById('coinFace').textContent = result === "heads" ? "★" : "✦";
      coin.classList.remove('flipping');
      txnCount++;
      if (result === btn.dataset.side) {
        const win = bet * 2;
        balance += win; totalEarned += bet;
        showResult('coinResult', `🎉 ${result.toUpperCase()}! +${win.toFixed(2)} tokens`, true);
      } else {
        showResult('coinResult', `💥 ${result.toUpperCase()}! -${bet.toFixed(2)} tokens`, false);
      }
      persistEarnings();
      coinBusy = false;
    }, 1900);
  });
});

// ----- 3) Lucky Dice -----
const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
let diceBusy = false;
document.querySelectorAll('#game-dice .choice-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!requireLogin() || diceBusy) return;
    const bet = parseFloat(document.getElementById('diceBet').value);
    if (!bet || bet <= 0) return alert("Bet ပမာဏ ထည့်ပါ");
    if (bet > balance) return alert("Balance မလုံလောက်ပါ");
    diceBusy = true;
    balance -= bet; persistEarnings();
    const diceEl = document.getElementById('dice');
    diceEl.classList.add('rolling');
    showResult('diceResult', "လှိမ့်နေသည်...", true);
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      diceEl.classList.remove('rolling');
      diceEl.textContent = DICE_FACES[roll - 1];
      const isHigh = roll >= 4;
      const picked = btn.dataset.pick;
      txnCount++;
      if ((picked === "high" && isHigh) || (picked === "low" && !isHigh)) {
        const win = bet * 2;
        balance += win; totalEarned += bet;
        showResult('diceResult', `🎉 ${roll} ထွက်သည်! +${win.toFixed(2)} tokens`, true);
      } else {
        showResult('diceResult', `💥 ${roll} ထွက်သည်! -${bet.toFixed(2)} tokens`, false);
      }
      persistEarnings();
      diceBusy = false;
    }, 1500);
  });
});

// ===== Restore session on load =====
(function init() {
  const saved = localStorage.getItem("currentUser");
  if (saved) setLoggedInUI(saved);
  if (wallet) {
    document.getElementById("statusText").textContent = "Connected";
    document.getElementById("statusDot").style.background = "#00fff0";
  }
  refreshStats();
})();
