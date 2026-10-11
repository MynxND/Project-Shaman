"""Project Shaman ComfyUI nodes. Copy this folder into ComfyUI/custom_nodes/."""
import numpy as np
import torch


def _grow(seed: np.ndarray, allowed: np.ndarray) -> np.ndarray:
    """4-connected flood fill of `seed` through `allowed` pixels."""
    mask = seed & allowed
    while True:
        grown = mask.copy()
        grown[1:, :] |= mask[:-1, :]
        grown[:-1, :] |= mask[1:, :]
        grown[:, 1:] |= mask[:, :-1]
        grown[:, :-1] |= mask[:, 1:]
        grown &= allowed
        if np.array_equal(grown, mask):
            return mask
        mask = grown


def _key_background(rgb: np.ndarray, tolerance: float) -> np.ndarray:
    """Return a bool mask of background pixels connected to the image border.

    Background colour is the median of the border pixels. A pixel joins the
    background when its largest channel difference from that colour is within
    tolerance and it touches the border through other background pixels.
    """
    h, w, _ = rgb.shape
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(border, axis=0)
    candidate = np.abs(rgb - bg).max(axis=2) <= tolerance

    seed = np.zeros((h, w), dtype=bool)
    seed[0, :] = seed[-1, :] = True
    seed[:, 0] = seed[:, -1] = True
    return _grow(seed, candidate)


def _key_ground_shadow(rgb: np.ndarray, background: np.ndarray, shadow_rows: float) -> np.ndarray:
    """Extend the background into a neutral grey ground shadow under the feet.

    Only neutral (low-chroma), mid-to-light pixels in the bottom `shadow_rows`
    fraction of the image that touch the keyed background are removed.
    """
    h = rgb.shape[0]
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    value = rgb.max(axis=2)
    allowed = (chroma <= 0.08) & (value >= 0.45)
    allowed[: int(h * (1.0 - shadow_rows)), :] = False
    return _grow(background, background | allowed)


class ShamanPixelBackgroundKey:
    """Hard-edged background removal for pixel sprites on a flat background."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
                "tolerance": ("FLOAT", {"default": 0.12, "min": 0.0, "max": 1.0, "step": 0.01}),
                "remove_ground_shadow": ("BOOLEAN", {"default": True}),
                "shadow_rows": ("FLOAT", {"default": 0.3, "min": 0.0, "max": 1.0, "step": 0.05}),
            }
        }

    RETURN_TYPES = ("IMAGE", "MASK")
    RETURN_NAMES = ("rgba", "background_mask")
    FUNCTION = "key"
    CATEGORY = "shaman/pixel"

    def key(self, image: torch.Tensor, tolerance: float, remove_ground_shadow: bool = False, shadow_rows: float = 0.3):
        rgba, masks = [], []
        for frame in image:
            rgb = frame[..., :3].cpu().numpy()
            background = _key_background(rgb, tolerance)
            if remove_ground_shadow:
                background = _key_ground_shadow(rgb, background, shadow_rows)
            alpha = (~background).astype(np.float32)[..., None]
            rgba.append(torch.from_numpy(np.concatenate([rgb, alpha], axis=2)))
            masks.append(torch.from_numpy(background.astype(np.float32)))
        return (torch.stack(rgba), torch.stack(masks))


class ShamanPixelColorBoost:
    """Saturation and contrast lift for washed-out sprites. Pure white stays white."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
                "saturation": ("FLOAT", {"default": 1.3, "min": 0.0, "max": 3.0, "step": 0.05}),
                "contrast": ("FLOAT", {"default": 1.15, "min": 0.5, "max": 2.0, "step": 0.05}),
            }
        }

    RETURN_TYPES = ("IMAGE",)
    FUNCTION = "boost"
    CATEGORY = "shaman/pixel"

    def boost(self, image: torch.Tensor, saturation: float, contrast: float):
        rgb = image[..., :3]
        luma = (rgb * torch.tensor([0.299, 0.587, 0.114], device=rgb.device)).sum(-1, keepdim=True)
        out = luma + (rgb - luma) * saturation
        # Pivot contrast at 1.0 so the white backdrop is preserved for keying.
        out = 1.0 - (1.0 - out) * contrast
        out = out.clamp(0.0, 1.0)
        if image.shape[-1] == 4:
            out = torch.cat([out, image[..., 3:]], dim=-1)
        return (out,)


NODE_CLASS_MAPPINGS = {
    "ShamanPixelBackgroundKey": ShamanPixelBackgroundKey,
    "ShamanPixelColorBoost": ShamanPixelColorBoost,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "ShamanPixelBackgroundKey": "Pixel Background Key (Shaman)",
    "ShamanPixelColorBoost": "Pixel Color Boost (Shaman)",
}
