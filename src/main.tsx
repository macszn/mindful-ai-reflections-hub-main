import './utils/theme-script';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerPushServiceWorker, isPushSupported } from './utils/pushNotifications'

createRoot(document.getElementById("root")!).render(<App />);

if (isPushSupported()) {
  registerPushServiceWorker().catch((err) => {
    console.warn('Service worker registration skipped:', err);
  });
}
