import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')!;

function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  // Normalise — remove extra spaces, uppercase
  const clean = timeStr.trim().toUpperCase().replace(/\s+/g, ' ');
  
  // Match "8:00 AM", "8:00AM", "08:00 AM" etc
  const ampm = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (ampm) {
    let h = parseInt(ampm[1]);
    const m = parseInt(ampm[2]);
    if (ampm[3] === 'PM' && h !== 12) h += 12;
    if (ampm[3] === 'AM' && h === 12) h = 0;
    return { hours: h, minutes: m };
  }
  // Match 24hr "14:30"
  const hr = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (hr) return { hours: parseInt(hr[1]), minutes: parseInt(hr[2]) };
  return null;
}

function rawToPkcs8(rawKey: Uint8Array): Uint8Array {
  const prefix = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07,
    0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20
  ]);
  const result = new Uint8Array(prefix.length + rawKey.length);
  result.set(prefix);
  result.set(rawKey, prefix.length);
  return result;
}

async function buildVapidJwt(audience: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const enc = new TextEncoder();
  const toB64 = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unsignedToken = `${toB64({ alg: 'ES256', typ: 'JWT' })}.${toB64({ aud: audience, exp: now + 43200, sub: VAPID_SUBJECT })}`;
  const rawKeyBytes = Uint8Array.from(
    atob(VAPID_PRIVATE_KEY.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  );
  const privateKey = await crypto.subtle.importKey(
    'pkcs8', rawToPkcs8(rawKeyBytes),
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: { name: 'SHA-256' } },
    privateKey, enc.encode(unsignedToken)
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${unsignedToken}.${sigB64}`;
}

async function sendPush(sub: any, payload: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  const origin = new URL(sub.endpoint).origin;
  try {
    const jwt = await buildVapidJwt(origin);
    const res = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
        'Content-Type': 'application/json',
        'TTL': '300',
        'Urgency': 'high',
      },
      body: payload,
    });
    const error = res.ok ? '' : await res.text().catch(() => '');
    return { ok: res.ok || res.status === 201, status: res.status, error };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const now = new Date();
  const OFFSET = 10; // AEST UTC+10
  const localHour = (now.getUTCHours() + OFFSET) % 24;
  const localMinute = now.getUTCMinutes();
  const nowMinutes = localHour * 60 + localMinute;

  console.log(`Local AEST: ${localHour}:${String(localMinute).padStart(2,'0')}`);

  const { data: subs, error: subErr } = await supabase.from('push_subscriptions').select('*');
  if (subErr) console.error('Sub error:', subErr);
  if (!subs?.length) return new Response(JSON.stringify({ message: 'No subscriptions', localTime: `${localHour}:${String(localMinute).padStart(2,'0')}` }), { status: 200 });

  const results: any[] = [];

  for (const sub of subs) {
    const { data: meds, error: medErr } = await supabase
      .from('medications').select('*')
      .eq('profile_id', sub.profile_id)
      .eq('as_needed', false);

    if (medErr) console.error('Med error:', medErr);
    if (!meds?.length) {
      results.push({ info: 'no regular meds for profile', profile: sub.profile_id });
      continue;
    }

    for (const med of meds) {
      for (const timeStr of (med.times ?? [])) {
        const parsed = parseTime(timeStr);
        if (!parsed) {
          results.push({ med: med.name, time: timeStr, skipped: 'could not parse time' });
          continue;
        }

        const medMinutes = parsed.hours * 60 + parsed.minutes;
        const diff = Math.abs(medMinutes - nowMinutes);
        if (diff > 2) continue; // 2-minute window

        // Check not already logged today
        const todayStart = new Date(now);
        todayStart.setUTCHours(-OFFSET, 0, 0, 0);
        const { data: todayLogs } = await supabase
          .from('medication_logs').select('id')
          .eq('profile_id', sub.profile_id)
          .eq('medication_id', med.id)
          .gte('timestamp', todayStart.toISOString());

        if (todayLogs?.length) {
          results.push({ med: med.name, skipped: 'already taken' });
          continue;
        }

        const payload = JSON.stringify({
          title: 'MedLedger 💊',
          body: `Time to take ${med.name} ${med.dose ?? ''}${med.unit ?? ''}`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: `med-${med.id}`,
          requireInteraction: true,
          data: { url: '/' },
        });

        const result = await sendPush(sub.subscription, payload);
        results.push({ med: med.name, time: timeStr, parsedTime: `${parsed.hours}:${parsed.minutes}`, ...result });

        if (result.status === 404 || result.status === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }
  }

  return new Response(JSON.stringify({ results, localTime: `${localHour}:${String(localMinute).padStart(2,'0')}`, utc: now.toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
