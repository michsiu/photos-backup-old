import json
import os
import subprocess
from datetime import datetime

photos = {}

for root, dirs, files in os.walk('photos'):

    for f in files:

        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):

            filepath = os.path.join(root, f)

            relative_path = os.path.relpath(filepath, 'photos')

            year = relative_path.split('/')[0]

            full_date = ''

            try:
                exif_date = subprocess.check_output(
                    [
                        'identify',
                        '-format',
                        '%[EXIF:DateTimeOriginal]',
                        filepath
                    ],
                    stderr=subprocess.DEVNULL
                ).decode().strip()

                if exif_date:
                    full_date = exif_date.split(' ')[0].replace(':', '-')

            except:
                pass

            if not full_date:

                mtime = os.path.getmtime(filepath)

                full_date = datetime.fromtimestamp(
                    mtime
                ).strftime('%Y-%m-%d')

            photos[f] = {
                'filename': f,
                'path': relative_path,
                'url': f'/photos/{relative_path}',
                'thumbnail': f'/thumbs/{relative_path}',
                'year': year,
                'date': full_date,
                'sha256': os.path.splitext(f)[0]
            }

with open('page/photos.json', 'w', encoding='utf-8') as f:

    json.dump(
        photos,
        f,
        ensure_ascii=False,
        indent=2
    )

print(f'生成 {len(photos)} 条记录')