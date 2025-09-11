import { supabase } from './supabase'

// Convert a base64 VAPID public key to a UInt8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function enablePushNotifications(profileName = '') {
  if (!('serviceWorker' in navigator)) throw new Error('Service worker not supported');
  if (!('PushManager' in window)) throw new Error('Push not supported');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission denied');

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || "BBGzUm3WCBNVdZufaVGeJEvA2dasPitGgz85sYv7KvFSoGSRez9Omk-vZetyuNfiza38MiRCV7oO2ImhX7zHIYs";
  if (!vapidPublicKey) throw new Error('Missing VAPID public key (VITE_VAPID_PUBLIC_KEY)');

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });

  // Store subscription in Supabase for later server-side pushes
  if (!supabase) return subscription;
  try {
    const { endpoint, keys } = subscription.toJSON();
    await supabase.from('push_subscriptions').upsert({
      endpoint,
      p256dh: keys?.p256dh,
      auth: keys?.auth,
      profile_name: profileName || null,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Failed to persist push subscription:', e);
  }
  return subscription;
}

export async function disablePushNotifications() {
  if (!('serviceWorker' in navigator)) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return false;
  try {
    const { endpoint } = sub;
    await sub.unsubscribe();
    if (supabase) await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  } catch (e) {
    console.warn('Failed to unsubscribe push:', e);
  }
  return true;
}
