// Deploy with: supabase functions deploy login-alert
// Required secrets: RESEND_API_KEY and LOGIN_ALERT_FROM.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authorization = request.headers.get('Authorization');
  if (!authorization) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  const userResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
    headers: { Authorization: authorization, apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '' },
  });
  if (!userResponse.ok) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  const user = await userResponse.json();
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('LOGIN_ALERT_FROM');
  if (!resendKey || !from || !user.email) {
    return new Response(JSON.stringify({ skipped: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const loginTime = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date());
  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [user.email],
      subject: 'New sign-in to your A_S Hamper account',
      html: `<p>A sign-in to your A_S Hamper account occurred on ${loginTime} (India time).</p><p>If this was not you, change your password immediately.</p>`,
    }),
  });
  if (!emailResponse.ok) return new Response('Email delivery failed', { status: 502, headers: corsHeaders });
  return new Response(JSON.stringify({ sent: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
