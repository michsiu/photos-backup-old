import json
import sys
import os

path = sys.argv[1]

json_path = 'photos.json'

if not os.path.exists(json_path):
    print('photos.json 不存在')
    exit(0)

with open(json_path, encoding='utf-8') as f:
    data = json.load(f)

keys = [
    k for k, v in data.items()
    if v.get('path') == path
]

for k in keys:
    del data[k]
    print(f'从JSON删除: {k}')

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)