export type DeviceTier = "low" | "mid" | "high";

export interface PerformanceProfile {
	deviceTier: DeviceTier;
	renderScale: number;
	maxFrameRate: 30 | 45 | 60 | 90 | 120;
	estimatedBandwidthKbps: number;
	connectionType: string;
	cpuCores: number;
	deviceMemoryGb: number;
	latencyMs: number;
}

export interface BandwidthSimulationOptions {
	effectiveType?: string;
	overrideKbps?: number;
	jitter?: boolean;
}

const effectiveTypeBandwidthMap: Record<string, number> = {
	slow-2g: 50,
	2g: 250,
	3g: 900,
	4g: 4000,
	5g: 10000,
	unknown: 1200,
};

function normalizeEffectiveType(value: string | undefined): string {
	if (!value) {
		return "unknown";
	}

	const normalized = value.toLowerCase();

	if (normalized.includes("5g")) {
		return "5g";
	}

	if (normalized.includes("4g")) {
		return "4g";
	}

	if (normalized.includes("3g")) {
		return "3g";
	}

	if (normalized.includes("2g")) {
		return "2g";
	}

	if (normalized.includes("slow-2g") || normalized.includes("slow2g")) {
		return "slow-2g";
	}

	return "unknown";
}

function classifyDeviceTier(
	cpuCores: number,
	deviceMemoryGb: number,
	effectiveType: string,
	downlink: number,
	saveData: boolean,
): DeviceTier {
	if (saveData || effectiveType === "slow-2g" || downlink < 0.5 || deviceMemoryGb <= 2 || cpuCores <= 2) {
		return "low";
	}

	if (cpuCores >= 8 && deviceMemoryGb >= 8 && (effectiveType === "4g" || effectiveType === "5g") && downlink >= 4) {
		return "high";
	}

	return "mid";
}

function calculateRenderScale(tier: DeviceTier, bandwidthKbps: number): number {
	if (tier === "high") {
		return 1;
	}

	if (tier === "mid") {
		return bandwidthKbps >= 2000 ? 0.95 : 0.85;
	}

	return bandwidthKbps >= 500 ? 0.8 : 0.7;
}

function calculateMaxFrameRate(tier: DeviceTier, connectionType: string): 30 | 45 | 60 | 90 | 120 {
	if (tier === "high") {
		return connectionType === "wifi" ? 120 : 90;
	}

	if (tier === "mid") {
		return connectionType === "wifi" ? 60 : 45;
	}

	return 30;
}

function getConnectionInfo() {
	if (typeof navigator === "undefined") {
		return {
			effectiveType: "unknown",
			downlink: 4,
			type: "unknown",
			saveData: false,
		};
	}

	const connection = (navigator as unknown as { connection?: NetworkInformation }).connection;
	const effectiveType = normalizeEffectiveType(connection?.effectiveType);
	const downlink = connection?.downlink ?? 4;
	const type = connection?.type ?? "unknown";
	const saveData = connection?.saveData ?? false;

	return {
		effectiveType,
		downlink,
		type,
		saveData,
	};
}

function applyCssVar(name: string, value: string): void {
	if (typeof document === "undefined") {
		return;
	}

	document.documentElement.style.setProperty(name, value);
}

export function applyPerformanceCssVars(profile: PerformanceProfile): void {
	applyCssVar("--device-tier", profile.deviceTier);
	applyCssVar("--render-scale", profile.renderScale.toString());
	applyCssVar("--max-frame-rate", profile.maxFrameRate.toString());
	applyCssVar("--estimated-bandwidth-kbps", profile.estimatedBandwidthKbps.toString());
	applyCssVar("--connection-type", profile.connectionType);
	applyCssVar("--device-cpu-cores", profile.cpuCores.toString());
	applyCssVar("--device-memory-gb", profile.deviceMemoryGb.toString());
	applyCssVar("--device-latency-ms", profile.latencyMs.toString());
}

export function detectPerformanceProfile(): PerformanceProfile {
	const cpuCores = typeof navigator !== "undefined" && typeof navigator.hardwareConcurrency === "number"
		? Math.max(1, Math.floor(navigator.hardwareConcurrency))
		: 4;
	const deviceMemoryGb = typeof navigator !== "undefined" && typeof navigator.deviceMemory === "number"
		? Math.max(1, Math.floor(navigator.deviceMemory))
		: 4;
	const { effectiveType, downlink, type, saveData } = getConnectionInfo();
	const estimatedBandwidthKbps = simulateBandwidth({ effectiveType }).downloadKbps;
	const deviceTier = classifyDeviceTier(cpuCores, deviceMemoryGb, effectiveType, downlink, saveData);
	const renderScale = calculateRenderScale(deviceTier, estimatedBandwidthKbps);
	const maxFrameRate = calculateMaxFrameRate(deviceTier, type);
	const latencyMs = Math.max(16, Math.round(1000 / Math.max(1, downlink)));

	const profile: PerformanceProfile = {
		deviceTier,
		renderScale,
		maxFrameRate,
		estimatedBandwidthKbps,
		connectionType: type,
		cpuCores,
		deviceMemoryGb,
		latencyMs,
	};

	applyPerformanceCssVars(profile);

	return profile;
}

export function throttle<Args extends readonly unknown[]>(
	callback: (...args: Args) => void,
	delayMs: number,
) {
	let lastCall = 0;
	let timeoutId = 0;
	let pendingArgs: Args | null = null;

	return (...args: Args) => {
		const now = Date.now();
		const elapsed = now - lastCall;

		if (elapsed >= delayMs) {
			lastCall = now;
			callback(...args);
			return;
		}

		pendingArgs = args;

		if (!timeoutId) {
			timeoutId = window.setTimeout(() => {
				lastCall = Date.now();
				if (pendingArgs) {
					callback(...pendingArgs);
				}
				pendingArgs = null;
				timeoutId = 0;
			}, delayMs - elapsed) as unknown as number;
		}
	};
}

export function simulateBandwidth(
	options: BandwidthSimulationOptions = {},
): {
	effectiveType: string;
	downloadKbps: number;
	uploadKbps: number;
	latencyMs: number;
} {
	const { effectiveType, overrideKbps, jitter } = options;
	const normalizedType = normalizeEffectiveType(effectiveType ?? getConnectionInfo().effectiveType);
	const baseDownloadKbps = overrideKbps ?? effectiveTypeBandwidthMap[normalizedType] ?? 1200;
	const jitterFactor = jitter ? 0.8 + Math.random() * 0.4 : 1;
	const downloadKbps = Math.max(50, Math.round(baseDownloadKbps * jitterFactor));
	const uploadKbps = Math.max(20, Math.round(downloadKbps * 0.25));
	const latencyMs = Math.max(20, Math.round(4000 / Math.max(1, downloadKbps / 1000)));

	return {
		effectiveType: normalizedType,
		downloadKbps,
		uploadKbps,
		latencyMs,
	};
}
