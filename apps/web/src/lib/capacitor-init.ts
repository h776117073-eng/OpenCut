import { Capacitor } from "@capacitor/core";

export async function initCapacitor() {
	if (typeof window === "undefined" || !Capacitor.isNativePlatform()) {
		return;
	}

	try {
		const { SplashScreen } = await import("@capacitor/splash-screen");
		await SplashScreen.hide();
	} catch {
		// Ignore if not available in web preview or on unsupported runtime.
	}

	try {
		const { StatusBar } = await import("@capacitor/status-bar");
		await StatusBar.setBackgroundColor({ color: "#000000" });
		await StatusBar.setStyle({ style: "DARK" });
	} catch {
		// Keep using native defaults when StatusBar is unavailable.
	}

	try {
		const { Keyboard } = await import("@capacitor/keyboard");
		await Keyboard.setAccessoryBarVisible({ isVisible: false });
		await Keyboard.setResizeMode({ mode: "native" });
	} catch {
		// Keyboard plugin may not be installed in web preview.
	}
}
