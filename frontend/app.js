// ၁။ Firebase SDK Modules များကို CDN မှ လှမ်းခေါ်ခြင်း (အပေါ်ဆုံးတွင် ထားရပါမည်)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

const API = window.API_URL || "https://game-earn-three.vercel.app";

// ၂။ Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD38acoFqL4HMrpFfow8ZBT1q-r7G9Xvw8",
  authDomain: "game-earn-718d5.firebaseapp.com",
  projectId: "game-earn-718d5",
  storageBucket: "game-earn-718d5.appspot.com",
  messagingSenderId: "947907604340",
  appId: "1:947907604340:web:0567be36482979cc930621",
  measurementId: "G-3NLRE36ECE"
};

// ၃။ Firebase အား အသက်သွင်းခြင်း
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let wallet = "";
let txnCount = 0;
let totalEarned = 0;
let isLoggedIn = false;
let userEmail = "";

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

document.getElementById('connectBtn').addEventListener('click', () => { openModal('walletModal'); document.getElementById('walletInput').focus(); });
document.getElementById('walletCancel').addEventListener('click', () => closeModal('walletModal'));

async function doConnectWallet(address) {
  if (!address) return;
  wallet = address;
  document.getElementById("statusText").textContent = "Connected";
  document.getElementById("statusDot").style.background = "#00fff0";
  document.getElementById("statBalance").textContent = (Math.random() * 5 + 1).toFixed(2);
  try { await fetch(`${API}/wallet`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address: wallet }) }); } catch (e) {}
}

document.getElementById('walletConfirmManual').addEventListener('click', async () => {
  const addr = document.getElementById('walletInput').value.trim();
  closeModal('walletModal');
  await doConnectWallet(addr);
});

// LOGIN / SIGNUP CONTROL
document.getElementById('loginBtn').addEventListener('click', () => {
  if (isLoggedIn) {
    isLoggedIn = false; userEmail = "";
    localStorage.clear();
    document.getElementById('loginBtn').innerHTML = "✦ &nbsp; Login / Sign Up";
    document.getElementById('statUserEmail').textContent = "Guest User";
    return;
  }
  openModal('loginModal');
});
document.getElementById('loginCancel').addEventListener('click', () => closeModal('loginModal'));

document.getElementById('signupConfirmAction').addEventListener('click', async () => {
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  if (!email || !password) return alert("ကျေးဇူးပြု၍ အချက်အလက်များ ဖြည့်ပါ");

  const res = await fetch(`${API}/api/user/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) { alert("အကောင့်ဖွင့်ခြင်း အောင်မြင်သည်"); await proceedLogin(email, password); }
  else { alert("အကောင့်ဖွင့်ခြင်း မအောင်မြင်ပါ"); }
});

document.getElementById('loginConfirmAction').addEventListener('click', async () => {
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  await proceedLogin(email, password);
});

// 🔑 ၄။ USE SSO LOGIN ขလုတ်အတွက် အသစ်ဖြည့်စွက်ထားသော ကုဒ်အပိုင်း
document.getElementById('ssoLoginBtn').addEventListener('click', () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      isLoggedIn = true;
      userEmail = user.email;
      
      // UI ပေါ်ရှိ အချက်အလက်များကို Update လုပ်ခြင်း
      closeModal('loginModal');
      document.getElementById('loginBtn').innerHTML = "❌ Logout";
      document.getElementById('statUserEmail').textContent = userEmail;
      
      alert(`${user.displayName} အနေဖြင့် SSO ဝင်ရောက်မှု အောင်မြင်ပါသည်!`);
    })
    .catch((error) => {
      console.error("SSO Error: ", error.message);
      alert("SSO ဝင်ရောက်မှု မအောင်မြင်ပါ။");
    });
});

async function proceedLogin(email, password) {
  const res = await fetch(`${API}/api/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.success) {
    isLoggedIn = true; userEmail = data.email;
    localStorage.setItem("userToken", data.token);
    closeModal('loginModal');
    document.getElementById('loginBtn').innerHTML = "❌ Logout";
    document.getElementById('statUserEmail').textContent = userEmail;
  } else { alert("Email သို့မဟုတ် Password မှားယွင်းနေပါသည်"); }
}

document.getElementById('playBtn').addEventListener('click', () => {
  if (!isLoggedIn) return alert("ကျေးဇူးပြု၍ အရင်ဆုံး Login ဝင်ပေးပါ");
  const reward = (Math.random() * 0.3 + 0.1).toFixed(3);
  totalEarned += parseFloat(reward); txnCount++;
  document.getElementById("statTxn").textContent = txnCount;
  document.getElementById("statEarned").textContent = totalEarned.toFixed(2);
  let cur = parseFloat(document.getElementById("statBalance").textContent) || 0;
  document.getElementById("statBalance").textContent = (cur + parseFloat(reward)).toFixed(2);
});

document.getElementById('withdrawBtn').addEventListener('click', () => {
  if (!isLoggedIn || !wallet) return alert("Login ဝင်ရန် သို့မဟုတ် Wallet ချိတ်ရန် လိုအပ်ပါသည်");
  openModal('withdrawModal');
});
document.getElementById('withdrawCancel').addEventListener('click', () => closeModal('withdrawModal'));
document.getElementById('withdrawConfirm').addEventListener('click', async () => {
  const amount = document.getElementById('amountInput').value;
  closeModal('withdrawModal');
  await fetch(`${API}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet, amount })
  });
  document.getElementById("statBalance").textContent = "0.00";
  alert("Withdraw Request တင်ခြင်း အောင်မြင်ပါသည်");
});

