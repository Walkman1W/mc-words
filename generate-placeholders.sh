#!/bin/bash
# Generate placeholder SVG card images for demo

BASE="D:/code/cc-money-win/project/task08/assets/images/cards"

create_card() {
  local dir="$1"
  local file="$2"
  local label="$3"
  local color="$4"

  cat > "$BASE/$dir/$file" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" fill="$color"/>
  <rect x="8" y="8" width="112" height="112" fill="${color}88" rx="4"/>
  <text x="64" y="64" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="11" font-weight="bold" fill="white">$label</text>
</svg>
EOF
}

# 02-tool
create_card "02-tool" "pickaxe.png" "PICKAXE" "#7B7B7B"
create_card "02-tool" "axe.png" "AXE" "#8B6914"
create_card "02-tool" "shovel.png" "SHOVEL" "#A0522D"
create_card "02-tool" "hoe.png" "HOE" "#6B4C12"
create_card "02-tool" "shears.png" "SHEARS" "#C0C0C0"

# 03-weapon
create_card "03-weapon" "sword.png" "SWORD" "#4169E1"
create_card "03-weapon" "bow.png" "BOW" "#8B4513"
create_card "03-weapon" "crossbow.png" "CROSSBOW" "#696969"
create_card "03-weapon" "trident.png" "TRIDENT" "#20B2AA"
create_card "03-weapon" "arrow.png" "ARROW" "#A0522D"

# 04-food
create_card "04-food" "apple.png" "APPLE" "#DC143C"
create_card "04-food" "bread.png" "BREAD" "#DEB887"
create_card "04-food" "steak.png" "STEAK" "#8B0000"
create_card "04-food" "carrot.png" "CARROT" "#FF8C00"
create_card "04-food" "melon.png" "MELON" "#228B22"

# 05-ore
create_card "05-ore" "coal.png" "COAL" "#1C1C1C"
create_card "05-ore" "iron.png" "IRON" "#D4A574"
create_card "05-ore" "gold.png" "GOLD" "#FFD700"
create_card "05-ore" "diamond.png" "DIAMOND" "#00CED1"
create_card "05-ore" "emerald.png" "EMERALD" "#50C878"

# 06-armor
create_card "06-armor" "helmet.png" "HELMET" "#4682B4"
create_card "06-armor" "chestplate.png" "CHESTPLATE" "#4682B4"
create_card "06-armor" "leggings.png" "LEGGINGS" "#4682B4"
create_card "06-armor" "boots.png" "BOOTS" "#4682B4"
create_card "06-armor" "shield.png" "SHIELD" "#8B4513"

# 07-redstone
create_card "07-redstone" "redstone.png" "REDSTONE" "#CC0000"
create_card "07-redstone" "piston.png" "PISTON" "#808080"
create_card "07-redstone" "lever.png" "LEVER" "#696969"
create_card "07-redstone" "repeater.png" "REPEATER" "#CC0000"
create_card "07-redstone" "hopper.png" "HOPPER" "#555555"

# 08-spawn-egg
create_card "08-spawn-egg" "creeper.png" "CREEPER" "#228B22"
create_card "08-spawn-egg" "zombie.png" "ZOMBIE" "#556B2F"
create_card "08-spawn-egg" "skeleton.png" "SKELETON" "#D3D3D3"
create_card "08-spawn-egg" "spider.png" "SPIDER" "#2F2F2F"
create_card "08-spawn-egg" "enderman.png" "ENDERMAN" "#1a0033"

echo "All placeholder cards generated!"
