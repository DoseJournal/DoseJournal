import type { Medication } from '../types';
import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = 'BECz9PXXmioDJF1e1dB480EA9dDYmFfbkHfcxC1K9_rQaeVRMMhMN7J4tkwojDso3auw_Mhy-Dv2wFLa8MMN1Kk';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPushSubscription(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as string,
      });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        profile_id: user.id,
        subscription: subscription.toJSON(),
      }, {
        onConflict: 'profile_id',
      });

    if (error) {
      await supabase.from('push_subscriptions').insert({
        profile_id: user.id,
        subscription: subscription.toJSON(),
      });
    }

    return true;
  } catch (e) {
    console.error('DoseJournal: push registration failed', e);
    return false;
  }
}

export async function enableNotifications(): Promise<{ success: boolean; message: string }> {
  if (!('Notification' in window)) {
    return { success: false, message: 'Notifications are not supported on this browser.' };
  }

  if (!('serviceWorker' in navigator)) {
    return { success: false, message: 'Service workers are not supported. Try installing the app to your home screen first.' };
  }

  const permission = await requestNotificationPermission();
  if (!permission) {
    return { success: false, message: 'Permission denied. Enable notifications in your device Settings → Safari → DoseJournal.' };
  }

  const registered = await registerPushSubscription();
  if (!registered) {
    return { success: false, message: 'Could not register for push notifications. Make sure you are signed in and try again.' };
  }

  return { success: true, message: 'Notifications enabled! You will be notified when your medications are due.' };
}

export function scheduleTodayReminders(medications: Medication[]): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  for (const med of medications) {
    if (med.asNeeded) continue;
    for (const timeStr of med.times) {
      const parsed = parseTime(timeStr);
      if (!parsed) continue;
      const scheduledTime = new Date();
      scheduledTime.setHours(parsed.hours, parsed.minutes, 0, 0);
      const msUntil = scheduledTime.getTime() - now.getTime();
      if (msUntil > 0 && msUntil < 24 * 60 * 60 * 1000) {
        setTimeout(() => showMedNotification(med), msUntil);
      }
    }
  }
}

function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  const clean = timeStr.trim().toUpperCase();
  const ampm = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (ampm) {
    let h = parseInt(ampm[1]);
    const m = parseInt(ampm[2]);
    if (ampm[3] === 'PM' && h !== 12) h += 12;
    if (ampm[3] === 'AM' && h === 12) h = 0;
    return { hours: h, minutes: m };
  }
  const hr = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (hr) return { hours: parseInt(hr[1]), minutes: parseInt(hr[2]) };
  return null;
}

function showMedNotification(med: Medication): void {
  if (Notification.permission !== 'granted') return;
  const body = `Time to take ${med.name} ${med.dose}${med.unit}`;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification('DoseJournal 💊', {
        body, icon: '/icon-192.png', badge: '/icon-192.png',
        tag: `med-${med.id}`, requireInteraction: true,
      } as NotificationOptions);
    });
  }
}

export async function saveScheduleToCache(medications: Medication[]): Promise<void> {
  if (!('caches' in window)) return;
  try {
    const schedule = medications
      .filter(m => !m.asNeeded)
      .flatMap(med => med.times.map(timeStr => {
        const parsed = parseTime(timeStr);
        if (!parsed) return null;
        return {
          id: med.id, name: med.name, dose: `${med.dose}${med.unit}`,
          time: `${parsed.hours.toString().padStart(2, '0')}:${parsed.minutes.toString().padStart(2, '0')}`,
        };
      }).filter(Boolean));
    const cache = await caches.open('dosejournal-notifications');
    await cache.put('schedule', new Response(JSON.stringify(schedule), { headers: { 'Content-Type': 'application/json' } }));
  } catch (e) { console.warn('DoseJournal: could not save schedule', e); }
}

export async function registerPeriodicSync(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    if ('periodicSync' in reg) {
      const ps = (reg as any).periodicSync;
      const tags = await ps.getTags();
      if (!tags.includes('med-reminders')) await ps.register('med-reminders', { minInterval: 60 * 1000 });
    }
  } catch (_) { /* not available */ }
}
