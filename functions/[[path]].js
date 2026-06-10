export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers for all responses
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-admin-token",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    // Admin credentials (override via environment variables in production)
    const ADMIN_EMAIL = env.ADMIN_EMAIL || "yt834434@gmail.com";
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "admin123";
    const expectedAdminToken = env.ADMIN_TOKEN || "game-earn-admin-secret-token";

    // Admin login -> returns token used for subsequent admin requests
    if (url.pathname === "/admin/login" && request.method === "POST") {
      try {
        const { email, password } = await request.json();
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          return new Response(
            JSON.stringify({ success: true, token: expectedAdminToken }),
            { headers }
          );
        }
        return new Response(
          JSON.stringify({ success: false, error: "Invalid credentials" }),
          { status: 401, headers }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, error: "Bad request" }),
          { status: 400, headers }
        );
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

    // ChatGPT (OpenAI) Agent Endpoint
    if (url.pathname === "/api/ai-agent" && request.method === "POST") {
      try {
        const { message } = await request.json();
        if (!message) return new Response(JSON.stringify({ error: "Message required" }), { status: 400, headers });

        const apiKey = env.OPENAI_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), { status: 500, headers });
        }

        const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a smart game earn assistant agent. Reply friendly." },
              { role: "user", content: message }
            ]
          })
        });

        const aiData = await openAiResponse.json();

        if (aiData.error) {
          return new Response(JSON.stringify({ error: "OpenAI Error: " + aiData.error.message }), { status: 500, headers });
        }

        return new Response(JSON.stringify({ success: true, reply: aiData.choices[0].message.content }), { headers });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Server Error: " + err.message }), { status: 500, headers });
      }
    }

    return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers });
  }
};
