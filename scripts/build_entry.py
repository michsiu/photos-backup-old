import json
import os

entry = {
    "filename": os.environ['ORIGINAL_NAME'],
    "path": f"{os.environ['YEAR']}/{os.environ['HASH_NAME']}",
    "url": f"/photos/{os.environ['YEAR']}/{os.environ['HASH_NAME']}",
    "thumbnail": f"/thumbs/{os.environ['YEAR']}/{os.environ['HASH_NAME']}",
    "year": os.environ['YEAR'],
    "date": os.environ['FULL_DATE'],
    "sha256": os.environ['SHA256']
}

json_path = "photos.json"
if os.path.exists(json_path):
    with open(json_path) as f:
        data = json.load(f)
else:
    data = {}

data[os.environ['HASH_NAME']] = entry

with open(json_path, "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)