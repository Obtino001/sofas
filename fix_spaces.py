import os

filepath = r"C:\Users\Yasir\Pictures\world-of-comfort\sofas\sections\footer.liquid"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace non-breaking space with normal space
content = content.replace('\xa0', ' ')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed non-breaking spaces in footer.liquid")
