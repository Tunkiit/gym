import json
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parents[1]
with (root / 'data' / 'exercises.json').open(encoding='utf-8') as f:
    catalog = json.load(f)
exact = {x.get('name', '').lower(): x for x in catalog}

presets = {
    'hiit': ['Jumping Jack','High Knee Taps','Burpee','Jump Squat','Bicycle','Flutter Kicks','Side to Side Plank','Mountain Climber','Plank to Push-up','Plank In & Out'],
    'abs': ['Plank Knee to Elbow','Plank Up & Down','Plank Jack','Seated In & Out','Russian Twist','Chair Sit-up','Lying Windshield Wiper','Abs Scissors','Flutter Kicks','Reverse Plank'],
}
# Exact matches first; close bodyweight movement when public dataset lacks exact name.
aliases = {
    'Jumping Jack': 'Star Jump', 'High Knee Taps': 'Step-up with Knee Raise',
    'Burpee': 'Rocket Jump', 'Jump Squat': 'Freehand Jump Squat',
    'Bicycle': 'Jackknife Sit-Up', 'Flutter Kicks': 'Flutter Kicks',
    'Side to Side Plank': 'Plank', 'Mountain Climber': 'Mountain Climbers',
    'Plank to Push-up': 'Push Up to Side Plank', 'Plank In & Out': 'Plank',
    'Plank Knee to Elbow': 'Plank', 'Plank Up & Down': 'Plank', 'Plank Jack': 'Plank',
    'Seated In & Out': 'Seated Leg Tucks', 'Russian Twist': 'Russian Twist',
    'Chair Sit-up': 'Sit-Up', 'Lying Windshield Wiper': 'Plank',
    'Abs Scissors': 'Scissor Kick', 'Reverse Plank': 'Plank',
}

def safe(s):
    return s.replace(' ', '_').replace('-', '_').replace('/', '_')

out = root / 'img' / 'home'
out.mkdir(parents=True, exist_ok=True)
manifest = {}
for preset, names in presets.items():
    for name in names:
        source = exact.get(name.lower()) or exact.get(aliases[name].lower())
        if not source:
            raise SystemExit(f'NO_SOURCE {name} -> {aliases[name]}')
        key = f'{preset}:{name}'
        manifest[key] = {'source_name': source['name'], 'id': source['id'], 'exact': source['name'] == name}
        for idx in (0, 1):
            target = out / f'{preset}_{safe(name)}_{idx}.jpg'
            url = f"https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{source['id']}/{idx}.jpg"
            urllib.request.urlretrieve(url, target)
            print('OK', key, source['name'], idx, target.stat().st_size)
(root / 'data' / 'home_exercise_images.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print('DOWNLOADED', len(manifest) * 2, 'images')
