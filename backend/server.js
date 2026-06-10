export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    const ADMIN_EMAIL = env.ADMIN_EMAIL || "yt834434@gmail.com";
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "admin1234";
    const expectedAdminToken = btoa(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`);

    if (url.pathname === "/" && request.method === "GET") {
      return new Response("Game Earn Backend running perfectly on Cloudflare Workers!", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    if (url.pathname === "/api/user/signup" && request.method === "POST") {
      try {
        const { email, password } = await request.json();
        if (!email || !password) return new Response(JSON.stringify({ error: "Email and password required" }), { status: 400, headers });

        let users = JSON.parse((await env.GAME_DB.get("users")) || "[]");
        if (users.find(u => u.email === email)) return new Response(JSON.stringify({ error: "Email already exists" }), { status: 400, headers });

        users.push({ email, password, createdAt: new Date().toISOString() });
        await env.GAME_DB.put("users", JSON.stringify(users));

        return new Response(JSON.stringify({ success: true, status: "User registered successfully" }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers });
      }
    }

    if (url.pathname === "/api/user/login" && request.method === "POST") {
      const { email, password } = await request.json();
      let users = JSON.parse((await env.GAME_DB.get("users")) || "[]");
      const user = users.find(u => u.email === email && u.password === password);

      if (user) {
        const userToken = btoa(email);
        return new Response(JSON.stringify({ success: true, token: userToken, email: user.email }), { headers });
      } else {
        return new Response(JSON.stringify({ success: false, error: "Wrong email or password" }), { status: 401, headers });
      }
    }

    if (url.pathname === "/wallet" && request.method === "POST") {
      const { address } = await request.json();
      if (!address) return new Response(JSON.stringify({ error: "address required" }), { status: 400, headers });

      let wallets = JSON.parse((await env.GAME_DB.get("wallets")) || "[]");
      if (!wallets.find(w => w.address === address)) {
        wallets.push({ address, connectedAt: new Date().toISOString() });
        await env.GAME_DB.put("wallets", JSON.stringify(wallets));
      }
      return new Response(JSON.stringify({ status: "wallet linked" }), { headers });
    }

    if (url.pathname === "/withdraw" && request.method === "POST") {
      const { wallet, amount } = await request.json();
      if (!amount) return new Response(JSON.stringify({ error: "amount required" }), { status: 400, headers });

      let withdrawals = JSON.parse((await env.GAME_DB.get("withdrawals")) || "[]");
      const entry = { id: withdrawals.length + 1, wallet: wallet || "unknown", amount, status: "pending", requestedAt: new Date().toISOString() };
      withdrawals.push(entry);
      await env.GAME_DB.put("withdrawals", JSON.stringify(withdrawals));

      return new Response(JSON.stringify({ status: "pending", wallet, amount }), { headers });
    }

    if (url.pathname === "/admin/login" && request.method === "POST") {
      const { email, password } = await request.json();
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ success: true, token: expectedAdminToken }), { headers });
      } else {
        return new Response(JSON.stringify({ success: false, error: "Wrong email or password" }), { status: 401, headers });
      }
    }

    const adminToken = request.headers.get("x-admin-token");
    const isAdmin = adminToken && adminToken === expectedAdminToken;

    if (url.pathname === "/admin/data" && request.method === "GET") {
      if (!isAdmin) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });

      let users = JSON.parse((await env.GAME_DB.get("users")) || "[]");
      let wallets = JSON.parse((await env.GAME_DB.get("wallets")) || "[]");
      let withdrawals = JSON.parse((await env.GAME_DB.get("withdrawals")) || "[]");

      return new Response(JSON.stringify({
        stats: {
          totalUsers: users.length,
          totalWallets: wallets.length,
          totalWithdrawals: withdrawals.length,
          pendingWithdrawals: withdrawals.filter(w => w.status === "pending").length,
          totalAmount: withdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0).toFixed(2),
        },
        users, wallets, withdrawals
      }), { headers });
    }

    if (url.pathname.startsWith("/admin/withdraw/") && request.method === "PATCH") {
      if (!isAdmin) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });

      const id = parseInt(url.pathname.split("/").pop());
      const { status } = await request.json();

      let withdrawals = JSON.parse((await env.GAME_DB.get("withdrawals")) || "[]");
      const entry = withdrawals.find(w => w.id === id);
      if (!entry) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });

      entry.status = status;
      await env.GAME_DB.put("withdrawals", JSON.stringify(withdrawals));
      return new Response(JSON.stringify({ success: true, entry }), { headers });
    }

    // AI Agent စနစ်သစ်
    if (url.pathname === "/api/ai-agent" && request.method === "POST") {
      try {
        const { message } = await request.json();
        if (!message) return new Response(JSON.stringify({ error: "Message required" }), { status: 400, headers });

        const aiResponse = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
          messages: [
            { role: "system", content: "You are a helpful game earn assistant agent." },
            { role: "user", content: message }
          ]
        });

        return new Response(JSON.stringify({ success: true, reply: aiResponse.response }), { headers });
      } catch (err) {
        return new Response(JSON.stringify({ error: "AI Error: " + err.message }), { status: 500, headers });
      }
    }

    return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers });
  }
};


