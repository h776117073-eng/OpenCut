type WorkerRequest =
	| { id: number; type: "initialize"; payload: { canvas: OffscreenCanvas } }
	| { id: number; type: "createTexture"; payload: { width: number; height: number } }
	| { id: number; type: "updateTexture"; payload: { handle: number; bitmap: ImageBitmap } }
	| { id: number; type: "bindTexture"; payload: { handle: number; unit: number } }
	| { id: number; type: "releaseTexture"; payload: { handle: number } }
	| { id: number; type: "present" };

type WorkerResponse =
	| { id: number; status: "ok"; result?: unknown }
	| { id: number; status: "error"; error: string };

interface WasmBridge {
	initializeVideoBridge(canvas: OffscreenCanvas): Promise<void>;
	createTextureHandle(width: number, height: number): Promise<number>;
	updateTexture(handle: number, bitmap: ImageBitmap): Promise<void>;
	bindTexture(handle: number, unit: number): Promise<void>;
	releaseTextureHandle(handle: number): Promise<void>;
	present(): Promise<void>;
}

let wasmBridge: WasmBridge | null = null;

async function loadWasmBridge(): Promise<WasmBridge> {
	if (wasmBridge) {
		return wasmBridge;
	}

	const wasmUrl = new URL("../../../src-native/video_bridge/pkg/video_bridge.js", import.meta.url);
	const wasmModule = await import(/* @vite-ignore */ wasmUrl.href);
	wasmBridge = wasmModule as WasmBridge;
	return wasmBridge;
}

async function postResult(id: number, result?: unknown) {
	const response: WorkerResponse = { id, status: "ok", result };
	self.postMessage(response);
}

async function postError(id: number, error: unknown) {
	const response: WorkerResponse = {
		id,
		status: "error",
		error: error instanceof Error ? error.message : String(error),
	};
	self.postMessage(response);
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
	const { id, type, payload } = event.data;

	try {
		const bridge = await loadWasmBridge();

		switch (type) {
			case "initialize": {
				await bridge.initializeVideoBridge(payload.canvas);
				await postResult(id);
				break;
			}
			case "createTexture": {
				const handle = await bridge.createTextureHandle(payload.width, payload.height);
				await postResult(id, handle);
				break;
			}
			case "updateTexture": {
				await bridge.updateTexture(payload.handle, payload.bitmap);
				await postResult(id);
				break;
			}
			case "bindTexture": {
				await bridge.bindTexture(payload.handle, payload.unit);
				await postResult(id);
				break;
			}
			case "releaseTexture": {
				await bridge.releaseTextureHandle(payload.handle);
				await postResult(id);
				break;
			}
			case "present": {
				await bridge.present();
				await postResult(id);
				break;
			}
			default: {
				throw new Error(`Unknown worker message type: ${type}`);
			}
		}
	} catch (error) {
		postError(id, error);
	}
};
