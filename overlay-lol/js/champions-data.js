/*
 * Champions intégrés (données Riot Data Dragon, fr_FR).
 * N'importe quel autre champion fonctionne aussi : ses infos sont récupérées
 * automatiquement depuis Data Dragon au chargement (ex. "Garen", "Kai'Sa", "Wukong").
 * Syntaxe d'une entrée dans la liste : "Ahri" ou "Ahri:5" (numéro de skin).
 */
window.URC_CHAMPS = {
  Ahri:   { key: 103, name: 'Ahri',    title: 'Renarde à neuf queues', tags: ['Mage', 'Assassin'] },
  Jinx:   { key: 222, name: 'Jinx',    title: 'Gâchette folle',        tags: ['Marksman'] },
  Yasuo:  { key: 157, name: 'Yasuo',   title: 'Disgracié',             tags: ['Fighter', 'Assassin'] },
  Lux:    { key: 99,  name: 'Lux',     title: 'Dame de lumière',       tags: ['Mage', 'Support'] },
  LeeSin: { key: 64,  name: 'Lee Sin', title: 'Moine aveugle',         tags: ['Fighter', 'Assassin'] },
  Thresh: { key: 412, name: 'Thresh',  title: 'Garde aux chaînes',     tags: ['Support', 'Tank'] },
  Ezreal: { key: 81,  name: 'Ezreal',  title: 'Explorateur prodigue',  tags: ['Marksman', 'Mage'] },
  Zed:    { key: 238, name: 'Zed',     title: 'Maître des ombres',     tags: ['Assassin'] },
  Kaisa:  { key: 145, name: "Kai'Sa",  title: 'Fille du Néant',        tags: ['Marksman', 'Mage'] },
  Teemo:  { key: 17,  name: 'Teemo',   title: 'Éclaireur de Bandle',   tags: ['Marksman', 'Mage'] }
};

window.URC_ROLES = {
  Mage: 'Mage', Assassin: 'Assassin', Marksman: 'Tireur',
  Fighter: 'Combattant', Tank: 'Tank', Support: 'Support'
};
