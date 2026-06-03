const ALL_CATEGORIES = [
  { id: '01-block', label: 'Block' },
  { id: '02-tool', label: 'Tool' },
  { id: '03-weapon', label: 'Weapon' },
  { id: '04-food', label: 'Food' },
  { id: '05-ore', label: 'Ore' },
  { id: '06-armor', label: 'Armor' },
  { id: '07-redstone', label: 'Redstone' },
  { id: '08-spawn-egg', label: 'Spawn Egg' },
];

let currentCategory = null;

export function getCategories() {
  return ALL_CATEGORIES;
}

export function getCurrentCategory() {
  const available = getCategories();
  if (!currentCategory || !available.find(c => c.id === currentCategory)) {
    currentCategory = available.length > 0 ? available[0].id : '01-block';
  }
  return currentCategory;
}

export function setCurrentCategory(id) {
  currentCategory = id;
}
