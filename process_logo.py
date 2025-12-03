from PIL import Image
import os

def process_logo():
    # Path to the user's latest uploaded image
    input_path = r"C:/Users/P.SUDHAKAR BABU/Downloads/farmvoicePro/public/logo1.png"
    output_path = r"C:/Users/P.SUDHAKAR BABU/Downloads/farmvoicePro/public/logo.png"

    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        
        datas = img.getdata()
        newData = []
        
        # The detected background color is #dedede which is (222, 222, 222)
        bg_color = (222, 222, 222)
        tolerance = 20  # Tolerance for background color matching

        for item in datas:
            # Check if pixel is close to background color
            if all(abs(item[i] - bg_color[i]) < tolerance for i in range(3)):
                newData.append((255, 255, 255, 0))  # Make transparent
            else:
                newData.append(item)

        img.putdata(newData)
        
        # Trim extra transparent space
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)

        img.save(output_path, "PNG")
        print(f"Successfully processed logo to {output_path}")
        
    except Exception as e:
        print(f"Error processing logo: {e}")

if __name__ == "__main__":
    process_logo()
