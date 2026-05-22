import type { PropsWithChildren } from "react";

export function SafeAreaLayout({ children }: PropsWithChildren<unknown>) {
	return (
		<div
			style={{
				minHeight: "100vh",
				paddingTop: "env(safe-area-inset-top, 0px)",
				paddingRight: "env(safe-area-inset-right, 0px)",
				paddingBottom: "env(safe-area-inset-bottom, 0px)",
				paddingLeft: "env(safe-area-inset-left, 0px)",
			}}
		>
			{children}
		</div>
	);
}
