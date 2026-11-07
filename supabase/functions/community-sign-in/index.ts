import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const invalidCredentials = "Invalid username or password.";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  let username: string;
  let password: string;
  try {
    const body = await request.json();
    username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return jsonResponse({ error: invalidCredentials }, 400);
  }

  if (!/^[a-z0-9_]{3,24}$/.test(username) || !password || password.length > 256) {
    return jsonResponse({ error: invalidCredentials }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Username sign-in is missing Supabase server environment variables.");
    return jsonResponse({ error: "Sign-in is temporarily unavailable." }, 500);
  }

  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: profile, error: profileError } = await adminClient
      .from("community_profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (profileError) throw profileError;
    let email = "invalid-community-login@invalid.example";
    if (profile) {
      const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(profile.id);
      if (userError) throw userError;
      email = userData.user.email || email;
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email,
      password,
    });
    if (!profile || authError || !authData.session) {
      return jsonResponse({ error: invalidCredentials }, 401);
    }

    return jsonResponse({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    });
  } catch (error) {
    console.error("Username sign-in failed.", error);
    return jsonResponse({ error: "Sign-in is temporarily unavailable." }, 500);
  }
});
