#![cfg(target_arch = "wasm32")]

use std::{cell::{Cell, RefCell}, collections::HashMap};
use wasm_bindgen::{prelude::wasm_bindgen, JsCast, JsValue};
use web_sys::{ImageBitmap, OffscreenCanvas, WebGl2RenderingContext, WebGlTexture};

#[wasm_bindgen]
pub struct TextureHandle(u32);

struct BridgeState {
    gl: WebGl2RenderingContext,
    textures: RefCell<HashMap<u32, WebGlTexture>>,
    next_handle: Cell<u32>,
}

thread_local! {
    static BRIDGE_STATE: RefCell<Option<BridgeState>> = RefCell::new(None);
}

fn with_bridge_state<T>(f: impl FnOnce(&BridgeState) -> Result<T, JsValue>) -> Result<T, JsValue> {
    BRIDGE_STATE.with(|state| {
        let borrow = state.borrow();
        let Some(state) = borrow.as_ref() else {
            return Err(JsValue::from_str("Video bridge is not initialized."));
        };
        f(state)
    })
}

fn create_webgl_context(canvas: &OffscreenCanvas) -> Result<WebGl2RenderingContext, JsValue> {
    let context = canvas
        .get_context("webgl2")
        .map_err(|error| JsValue::from(error))?
        .ok_or_else(|| JsValue::from_str("WebGL2 context unavailable on OffscreenCanvas"))?;

    let gl = context
        .dyn_into::<WebGl2RenderingContext>()
        .map_err(|_| JsValue::from_str("Failed to cast context to WebGl2RenderingContext"))?;

    gl.enable(WebGl2RenderingContext::TEXTURE_2D);
    Ok(gl)
}

fn get_texture(state: &BridgeState, handle: u32) -> Result<WebGlTexture, JsValue> {
    state
        .textures
        .borrow()
        .get(&handle)
        .cloned()
        .ok_or_else(|| JsValue::from_str("Texture handle not found"))
}

#[wasm_bindgen(js_name = initializeVideoBridge)]
pub fn initialize_video_bridge(canvas: JsValue) -> Result<(), JsValue> {
    let canvas = canvas
        .dyn_into::<OffscreenCanvas>()
        .map_err(|_| JsValue::from_str("Expected an OffscreenCanvas for initialization"))?;

    let gl = create_webgl_context(&canvas)?;
    let state = BridgeState {
        gl,
        textures: RefCell::new(HashMap::new()),
        next_handle: Cell::new(1),
    };

    BRIDGE_STATE.with(|bridge| bridge.replace(Some(state)));
    Ok(())
}

#[wasm_bindgen(js_name = createTextureHandle)]
pub fn create_texture_handle(width: u32, height: u32) -> Result<u32, JsValue> {
    with_bridge_state(|state| {
        let texture = state
            .gl
            .create_texture()
            .ok_or_else(|| JsValue::from_str("Failed to create WebGL texture"))?;

        state.gl.bind_texture(WebGl2RenderingContext::TEXTURE_2D, Some(&texture));
        state.gl.tex_parameteri(
            WebGl2RenderingContext::TEXTURE_2D,
            WebGl2RenderingContext::TEXTURE_MIN_FILTER,
            WebGl2RenderingContext::LINEAR as i32,
        );
        state.gl.tex_parameteri(
            WebGl2RenderingContext::TEXTURE_2D,
            WebGl2RenderingContext::TEXTURE_MAG_FILTER,
            WebGl2RenderingContext::LINEAR as i32,
        );
        state.gl.tex_parameteri(
            WebGl2RenderingContext::TEXTURE_2D,
            WebGl2RenderingContext::TEXTURE_WRAP_S,
            WebGl2RenderingContext::CLAMP_TO_EDGE as i32,
        );
        state.gl.tex_parameteri(
            WebGl2RenderingContext::TEXTURE_2D,
            WebGl2RenderingContext::TEXTURE_WRAP_T,
            WebGl2RenderingContext::CLAMP_TO_EDGE as i32,
        );
        state.gl.tex_image_2d_with_i32_and_i32_and_i32_and_format_and_type_and_opt_u8_array(
            WebGl2RenderingContext::TEXTURE_2D,
            0,
            WebGl2RenderingContext::RGBA as i32,
            width as i32,
            height as i32,
            0,
            WebGl2RenderingContext::RGBA,
            WebGl2RenderingContext::UNSIGNED_BYTE,
            None,
        )?;

        let handle = state.next_handle.get();
        state.next_handle.set(handle + 1);
        state.textures.borrow_mut().insert(handle, texture);
        Ok(handle)
    })
}

#[wasm_bindgen(js_name = updateTexture)]
pub fn update_texture(handle: u32, bitmap: JsValue) -> Result<(), JsValue> {
    with_bridge_state(|state| {
        let texture = get_texture(state, handle)?;
        let bitmap = bitmap
            .dyn_into::<ImageBitmap>()
            .map_err(|_| JsValue::from_str("Expected an ImageBitmap for texture update"))?;

        state.gl.bind_texture(WebGl2RenderingContext::TEXTURE_2D, Some(&texture));
        state.gl.tex_image_2d_with_u32_and_u32_and_image_bitmap(
            WebGl2RenderingContext::TEXTURE_2D,
            0,
            WebGl2RenderingContext::RGBA,
            WebGl2RenderingContext::RGBA,
            WebGl2RenderingContext::UNSIGNED_BYTE,
            &bitmap,
        )?;
        Ok(())
    })
}

#[wasm_bindgen(js_name = bindTexture)]
pub fn bind_texture(handle: u32, unit: u32) -> Result<(), JsValue> {
    with_bridge_state(|state| {
        let texture = get_texture(state, handle)?;
        let unit_index = WebGl2RenderingContext::TEXTURE0 + unit;
        state.gl.active_texture(unit_index);
        state.gl.bind_texture(WebGl2RenderingContext::TEXTURE_2D, Some(&texture));
        Ok(())
    })
}

#[wasm_bindgen(js_name = releaseTextureHandle)]
pub fn release_texture_handle(handle: u32) -> Result<(), JsValue> {
    with_bridge_state(|state| {
        let texture = state
            .textures
            .borrow_mut()
            .remove(&handle)
            .ok_or_else(|| JsValue::from_str("Texture handle not found"))?;

        state.gl.delete_texture(Some(&texture));
        Ok(())
    })
}

#[wasm_bindgen(js_name = present)]
pub fn present() -> Result<(), JsValue> {
    with_bridge_state(|state| {
        state.gl.flush();
        Ok(())
    })
}
