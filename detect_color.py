from PIL import Image

def get_bg_color():
    img_path = r"C:/Users/P.SUDHAKAR BABU/Downloads/farmvoicePro/public/logo1.png"
    try:
        img = Image.open(img_path)
        img = img.convert("RGB")
        # Get top-left pixel color
        bg_color = img.getpixel((0, 0))
        # Convert to hex
        hex_color = '#{:02x}{:02x}{:02x}'.format(*bg_color)
        print(f"Background Color: {hex_color}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_bg_color()
