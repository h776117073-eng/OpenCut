import { useCallback, useEffect, useState } from "react";
import { revenueCatService, type RevenueCatSubscriptionInfo } from "@/lib/monetization/revenueCatService";

export interface UseSubscriptionState {
	status: RevenueCatSubscriptionInfo["status"];
	productId?: string;
	expirationDate?: string;
	isTrial?: boolean;
	loading: boolean;
	error: string | null;
}

export interface UseSubscriptionResult extends UseSubscriptionState {
	refresh: () => Promise<void>;
	purchasePackage: (packageId: string) => Promise<void>;
	restorePurchases: () => Promise<void>;
}

const initialState: UseSubscriptionState = {
	status: "unknown",
	productId: undefined,
	expirationDate: undefined,
	isTrial: undefined,
	loading: false,
	error: null,
};

export function useSubscription(userId: string | null): UseSubscriptionResult {
	const [state, setState] = useState<UseSubscriptionState>(initialState);

	const updateState = useCallback((info: RevenueCatSubscriptionInfo) => {
		setState((current) => ({
			...current,
			status: info.status,
			productId: info.productId,
			expirationDate: info.expirationDate,
			isTrial: info.isTrial,
			loading: false,
			error: null,
		}));
	}, []);

	const refresh = useCallback(async () => {
		if (!userId) {
			setState((current) => ({
				...current,
				status: "unknown",
				loading: false,
				error: "Missing user ID",
			}));
			return;
		}

		setState((current) => ({ ...current, loading: true, error: null }));

		try {
			await revenueCatService.initialize(userId);
			const info = await revenueCatService.checkSubscription();
			updateState(info);
		} catch (error) {
			setState({
				...initialState,
				loading: false,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}, [userId, updateState]);

	const purchasePackage = useCallback(async (packageId: string) => {
		setState((current) => ({ ...current, loading: true, error: null }));

		try {
			if (!userId) {
				throw new Error("Missing user ID");
			}

			await revenueCatService.initialize(userId);
			const info = await revenueCatService.purchasePackage(packageId);
			updateState(info);
		} catch (error) {
			setState((current) => ({
				...current,
				loading: false,
				error: error instanceof Error ? error.message : String(error),
			}));
		}
	}, [userId, updateState]);

	const restorePurchases = useCallback(async () => {
		setState((current) => ({ ...current, loading: true, error: null }));

		try {
			if (!userId) {
				throw new Error("Missing user ID");
			}

			await revenueCatService.initialize(userId);
			const info = await revenueCatService.restorePurchases();
			updateState(info);
		} catch (error) {
			setState((current) => ({
				...current,
				loading: false,
				error: error instanceof Error ? error.message : String(error),
			}));
		}
	}, [userId, updateState]);

	useEffect(() => {
		if (!userId) {
			return;
		}

		void refresh();
	}, [userId, refresh]);

	return {
		...state,
		refresh,
		purchasePackage,
		restorePurchases,
	};
}
