import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clean up stale service workers from old deployments that can break SPA routing/fetch.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
	void navigator.serviceWorker.getRegistrations().then((registrations) => {
		for (const registration of registrations) {
			void registration.unregister();
		}
	});

	if ("caches" in window) {
		void caches.keys().then((keys) => {
			for (const key of keys) {
				void caches.delete(key);
			}
		});
	}
}

createRoot(document.getElementById("root")!).render(<App />);
