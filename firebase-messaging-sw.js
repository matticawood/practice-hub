/* Firebase Cloud Messaging service worker — Android (TWA) / web push.
   Registered at scope /firebase-cloud-messaging-push-scope so it coexists with
   the main app service worker (sw.js, scope "/") without replacing it.

   The send-push edge function sends a `notification` payload, so FCM displays
   the notification automatically and handles the click via webpush.fcm_options
   .link. onBackgroundMessage below is a fallback for any data-only message. */
// Take over immediately when a new version is deployed, so handler changes
// (e.g. the duplicate-notification fix) apply on the next reload rather than
// waiting for every tab to close.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAjLspvkbQtiHo7yEg-B6Tg6AYJ30Sh_Hg",
  authDomain: "the-practice-room.firebaseapp.com",
  projectId: "the-practice-room",
  storageBucket: "the-practice-room.firebasestorage.app",
  messagingSenderId: "149724607479",
  appId: "1:149724607479:web:1ec7e02d20d97b15eaf4f2",
});

// Initialising messaging in the SW is what lets FCM display the notification.
// We deliberately do NOT add an onBackgroundMessage handler: our server always
// sends a `notification` payload, which FCM displays automatically. Adding a
// handler that also calls showNotification produces a DUPLICATE banner.
firebase.messaging();

// Update the OS app-icon badge when a push arrives while the app is closed/
// backgrounded. send-push puts the recipient's current unread count in
// data.badge. (Display of the notification itself is handled by FCM.)
self.addEventListener("push", (event) => {
  try {
    const payload = event.data ? event.data.json() : null;
    const raw = payload && (
      (payload.data && payload.data.badge) ||
      (payload.notification && payload.notification.badge) ||
      (payload.FCM_MSG && payload.FCM_MSG.data && payload.FCM_MSG.data.badge)
    );
    if (raw != null && "setAppBadge" in navigator) {
      const n = parseInt(raw, 10);
      if (!isNaN(n)) event.waitUntil(n > 0 ? navigator.setAppBadge(n) : navigator.clearAppBadge());
    }
  } catch (e) { /* ignore */ }
});

// Click → focus an existing tab and navigate, or open a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const d = event.notification.data || {};
  const link = d.link_url || (d.FCM_MSG && d.FCM_MSG.data && d.FCM_MSG.data.link_url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ("focus" in w) { try { w.navigate && w.navigate(link); } catch (e) {} return w.focus(); }
      }
      return self.clients.openWindow(link);
    })
  );
});
