export type TextureHandle = number;

interface WorkerRequest<T = unknown> {
	id: number;
	type: string;
	payload?: T;
}

interface WorkerResponse<R = unknown> {
	id: number;
	status: "ok" | "error";
	result?: R;
	error?: string;
}

type WorkerInitPayload = { canvas: OffscreenCanvas };
type WorkerTexturePayload = { width: number; height: number };
type WorkerUpdatePayload = { handle: TextureHandle; bitmap: ImageBitmap };
type WorkerBindPayload = { handle: TextureHandle; unit: number };
type WorkerReleasePayload = { handle: TextureHandle };

export class VideoBridge {
	private worker: Worker;
	private nextMessageId = 1;
	private pending = new Map<
		number,
		{
			resolve: (value: unknown) => void;
			reject: (reason?: unknown) => void;
		}
	>();

	constructor() {
		this.worker = new Worker(new URL("./video-bridge.worker.ts", import.meta.url), {
			type: "module",
		});
		this.worker.onmessage = this.handleWorkerResponse.bind(this);
	}

	private createRequest<T = unknown>(type: string, payload?: unknown, transfers?: Transferable[]) {
		return new Promise<T>((resolve, reject) => {
			const id = this.nextMessageId++;
			this.pending.set(id, { resolve, reject });
			const message: WorkerRequest = { id, type, payload };
			this.worker.postMessage(message, transfers ?? []);
		});
	}

	private handleWorkerResponse(event: MessageEvent<WorkerResponse>) {
		const { id, status, result, error } = event.data;
		const pending = this.pending.get(id);
		if (!pending) {
			return;
		}
		this.pending.delete(id);
		if (status === "ok") {
			pending.resolve(result);
			return;
		}
		pending.reject(new Error(error ?? "Video bridge worker error"));
	}

	public async initialize(canvas: OffscreenCanvas): Promise<void> {
		await this.createRequest<void>("initialize", { canvas }, [canvas]);
	}

	public async createTexture(width: number, height: number): Promise<TextureHandle> {
		return this.createRequest<TextureHandle>("createTexture", { width, height });
	}

	public async updateTexture(handle: TextureHandle, bitmap: ImageBitmap): Promise<void> {
		await this.createRequest<void>("updateTexture", { handle, bitmap }, [bitmap]);
	}

	public async bindTexture(handle: TextureHandle, unit: number): Promise<void> {
		await this.createRequest<void>("bindTexture", { handle, unit });
	}

	public async releaseTexture(handle: TextureHandle): Promise<void> {
		await this.createRequest<void>("releaseTexture", { handle });
	}

	public async present(): Promise<void> {
		await this.createRequest<void>("present");
	}

	public dispose(): void {
		this.worker.terminate();
		this.pending.clear();
	}
}
