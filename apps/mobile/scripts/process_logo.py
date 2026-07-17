from PIL import Image
import os

src_path = r"C:\Users\ADMIN\.cursor\projects\c-Users-ADMIN-Desktop-AI-Journaling-App\assets\c__Users_ADMIN_AppData_Roaming_Cursor_User_workspaceStorage_80b201f9e1a926194fe6af5365f0860d_images_image-a0a8edea-9694-47b3-ab4d-48e1d78eff8a.png"
out_dir = r"c:\Users\ADMIN\Desktop\AI Journaling App\apps\mobile\assets\images"
os.makedirs(out_dir, exist_ok=True)

img = Image.open(src_path).convert("RGBA")
pixels = img.load()
w, h = img.size

mark = Image.new("RGBA", (w, h), (0, 0, 0, 0))
mp = mark.load()
for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if r < 40 and g < 40 and b < 40:
            mp[x, y] = (0, 0, 0, 0)
        else:
            mp[x, y] = (r, g, b, a)

mark_path = os.path.join(out_dir, "logo-mark.png")
mark.save(mark_path, "PNG")

night = (1, 18, 47, 255)  # #01122F
icon = Image.new("RGBA", (w, h), night)
icon.alpha_composite(mark)
icon_rgb = icon.convert("RGB")

for name in ("logo.png", "icon.png", "splash-icon.png", "android-icon-foreground.png", "favicon.png"):
    icon_rgb.save(os.path.join(out_dir, name), "PNG")

bg = Image.new("RGB", (w, h), (1, 18, 47))
bg.save(os.path.join(out_dir, "android-icon-background.png"), "PNG")

mono = Image.new("RGBA", (w, h), (0, 0, 0, 0))
mop = mono.load()
for y in range(h):
    for x in range(w):
        r, g, b, a = mp[x, y]
        if a > 10:
            mop[x, y] = (255, 255, 255, a)
mono.save(os.path.join(out_dir, "android-icon-monochrome.png"), "PNG")

# Also copy source into assets for reference
img.convert("RGB").save(os.path.join(out_dir, "..", "image.png"), "PNG")

print("done", w, h, "mark_bytes", os.path.getsize(mark_path))
