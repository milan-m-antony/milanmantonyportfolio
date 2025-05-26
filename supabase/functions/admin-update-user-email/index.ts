import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req)=>{
  // 1. Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }

  // 2. Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: "Method Not Allowed. Only POST requests are accepted."
    }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    // 3. Get Supabase credentials from secrets
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Function Misconfiguration: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in secrets.");
      return new Response(JSON.stringify({
        error: "Server configuration error."
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 4. Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 5. Get the calling user's ID from the JWT
    // This requires the function to be invoked with a valid user JWT
    // and "Verify JWT" enabled in function settings.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        error: "Unauthorized: Missing or invalid Authorization header."
      }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      console.error("Error getting user from JWT:", userError);
      return new Response(JSON.stringify({
        error: "Unauthorized: Invalid token or user not found."
      }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    const userId = user.id;

    // 6. Parse request body for newEmail
    const { newEmail } = await req.json();
    if (!newEmail || typeof newEmail !== 'string' || newEmail.trim() === '') {
      return new Response(JSON.stringify({
        error: "Invalid request: newEmail is required."
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 7. Update the user's email using admin privileges
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: newEmail.trim()
    });

    if (updateError) {
      console.error(`Error updating email for user ${userId} to ${newEmail.trim()}:`, updateError);
      throw new Error(updateError.message || "Failed to update email in Supabase Auth.");
    }

    // 8. Mark the new email as confirmed to bypass confirmation email to the new address
    const { data: confirmData, error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true
    });

    if (confirmError) {
      console.warn(`Email updated for user ${userId} to ${newEmail.trim()}, but failed to auto-confirm:`, confirmError);
    // Decide if this is a critical error or just a warning
    // For now, proceed as email change was successful
    }

    console.log(`Admin user ${userId} email successfully changed to ${newEmail.trim()} and confirmed.`);

    return new Response(JSON.stringify({
      message: "Email/Username changed successfully. You may need to log in again with the new email."
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error("Critical Error in admin-update-user-email Edge Function:", error.message, error.stack);
    return new Response(JSON.stringify({
      error: error.message || "An unexpected server error occurred."
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}); 