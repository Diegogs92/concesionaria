# Paso 1 del pipeline de vehículos del hero: quitar el fondo con rembg (local).
# Entrada:  public/vehicles/raw/{sedan,suv,moto}.png
# Salida:   public/vehicles/tmp/{sedan,suv,moto}.png (PNG con alpha)
# Uso:      python scripts/remove_bg.py

from pathlib import Path
from rembg import remove

root = Path(__file__).resolve().parent.parent
raw = root / "public" / "vehicles" / "raw"
tmp = root / "public" / "vehicles" / "tmp"
tmp.mkdir(parents=True, exist_ok=True)

names = ["sedan", "suv", "moto"]
done = 0
for name in names:
    src = raw / f"{name}.png"
    if not src.exists():
        print(f"x falta {src.relative_to(root)}")
        continue
    print(f"-> {name}: quitando fondo...")
    (tmp / f"{name}.png").write_bytes(remove(src.read_bytes()))
    done += 1
    print(f"ok {name}")

print(f"\n{done}/{len(names)} procesados en public/vehicles/tmp/")
raise SystemExit(0 if done == len(names) else 1)
