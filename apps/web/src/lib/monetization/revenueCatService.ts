import { webEnv } from "@/env/web";

export type RevenueCatSubscriptionState = `active` | `inactive` | `trial` | `unknown`;

export interface RevenueCatSubscriptionInfo {
	status: RevenueCatSubscriptionState;
	productId?: string;
	expirationDate?: string;
	isTrial?: boolean;
	raw?: unknown;
}

export class RevenueCatService {
	private apiKey = webEnv.NEXT_PUBLIC_REVENUECAT_API_KEY;
	private userId: string | null = null;
	private initialized = false;

	private ensureConfigured() {
		if (!this.apiKey) {
			throw new Error(
				"RevenueCat public API key is not configured. Set NEXT_PUBLIC_REVENUECAT_API_KEY in the environment.",
			);
		}

		if (!this.initialized || !this.userId) {
			throw new Error("RevenueCatService must be initialized with a user ID before use.");
		}
	}

	public async initialize(userId: string) {
		if (!userId) {
			throw new Error("RevenueCatService requires a valid user ID.");
		}

		this.userId = userId;
		this.initialized = true;
		return this;
	}

	public async checkSubscription(): Promise<RevenueCatSubscriptionInfo> {
		this.ensureConfigured();

		const response = await this.fetchRevenueCatApi("/api/revenuecat/subscriber", {
			userId: this.userId,
		});

		return {
			status: response.status ?? "unknown",
			productId: response.productId,
			expirationDate: response.expirationDate,
			isTrial: response.isTrial,
			raw: response,
		};
	}

	public async purchasePackage(packageId: string): Promise<RevenueCatSubscriptionInfo> {
		this.ensureConfigured();

		const response = await this.fetchRevenueCatApi("/api/revenuecat/purchase", {
			userId: this.userId,
			packageId,
		});

		return {
			status: response.status ?? "unknown",
			productId: response.productId,
			expirationDate: response.expirationDate,
			isTrial: response.isTrial,
			raw: response,
		};
	}

	public async restorePurchases(): Promise<RevenueCatSubscriptionInfo> {
		this.ensureConfigured();

		const response = await this.fetchRevenueCatApi("/api/revenuecat/restore", {
			userId: this.userId,
		});

		return {
			status: response.status ?? "unknown",
			productId: response.productId,
			expirationDate: response.expirationDate,
			isTrial: response.isTrial,
			raw: response,
		};
	}

	private async fetchRevenueCatApi(endpoint: string, payload: Record<string, unknown>) {
		const response = await fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error(`RevenueCat request failed: ${response.status}`);
		}

		return response.json();
	}
}

export const revenueCatService = new RevenueCatService();
