import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
	appId: "com.opencut.app",
	appName: "OpenCut",
	webDir: "apps/web/out",
	bundledWebRuntime: false,
	server: {
		androidScheme: "capacitor",
		iosScheme: "capacitor",
	},
	plugins: {
		SplashScreen: {
			launchShowDuration: 0,
			launchAutoHide: true,
			backgroundColor: "#000000",
			androidScaleType: "CENTER_CROP",
			showSpinner: false,
			splashFullScreen: true,
			splashImmersive: true,
		},
		StatusBar: {
			style: "DARK",
			backgroundColor: "#000000",
			webViewBackgroundColor: "#000000",
		},
	},
};

export default config;
