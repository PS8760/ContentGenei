#!/usr/bin/env python3
import base64

# Simple 1x1 purple PNG (will be scaled by browser)
# This is a minimal valid PNG file
png_data = base64.b64decode(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABfSURBVDiN7ZKxDYAwDATvQkEBK7ACK7ACG7ACK1AwAiuwAiuwQkpKCgoKfuST7Nzd2U4AAAD+xRhjjDHGGGOMMcYYY4wxxhhjjDHGGGOMMcYYY4wxxhhjjDHGGGOMMcYYY4z5Aw8yBxAXqFjm3AAAAABJRU5ErkJggg=='
)

# Write icon files
for size in [16, 48, 128]:
    with open(f'icon{size}.png', 'wb') as f:
        f.write(png_data)
    print(f'✅ Created icon{size}.png')

print('\n🎉 All icons created!')
