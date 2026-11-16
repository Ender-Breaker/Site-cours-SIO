-- Table des calories (extrait de 66 aliments) - script MySQL
-- Accents réparés, encodage UTF-8. Les colonnes chiffrées sont des INTEGER :
-- MySQL arrondit les valeurs décimales à l'insertion (25.1 -> 25, 0.5 -> 1).
/* CREATE DATABASE BDCALORIE CHARACTER SET utf8mb4;
USE BDCALORIE; */

CREATE TABLE CALORIE (
  CatAl  VARCHAR(60)  NULL,
  NomAl  VARCHAR(120) NOT NULL,
  Cal    INTEGER      NOT NULL,
  Prot   INTEGER      NOT NULL,
  Glu    INTEGER      NOT NULL,
  Lip    INTEGER      NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE CALORIE ADD CONSTRAINT Pkcalorie PRIMARY KEY (NomAl);

INSERT INTO CALORIE VALUES ('Abat', 'Abats en sauce (100g)', 290, 17, 0, 19);
INSERT INTO CALORIE VALUES ('Poisson', 'Ablette (100g)', 144, 18, 0, 8);
INSERT INTO CALORIE VALUES ('Fromage', 'Abondance (tomme) (100g)', 402, 25.1, 0, 33);
INSERT INTO CALORIE VALUES ('Conserve', 'Abricot (au sirop) (100g)', 63, 0, 16, 0);
INSERT INTO CALORIE VALUES ('Compote', 'Abricot (compote sucrée) (100g)', 165, 0, 40, 0.2);
INSERT INTO CALORIE VALUES ('Compote', 'Abricot (non sucrée) (100g)', 119, 0, 29, 0.1);
INSERT INTO CALORIE VALUES ('Boisson', 'Abricot jus (100g)', 60, 0, 15, 0);
INSERT INTO CALORIE VALUES ('Fruit sec', 'Abricot sec (monoprix gourmet) (100g)', 294, 5, 67.9, 0.2);
INSERT INTO CALORIE VALUES ('Fruit sec', 'Abricot sec Maître prunille (100g)', 172, 3.4, 33.8, 0.5);
INSERT INTO CALORIE VALUES ('Fruit sec', 'Abricot secs (sunny glade chez lidl) (100g)', 158, 4, 36.5, 0.5);
INSERT INTO CALORIE VALUES ('Fruit', 'Abricot, cru (100g)', 45, 1, 10, 0);
INSERT INTO CALORIE VALUES ('Conserve', 'Abricots au sirop, douceur du verger Leclerc marque repère (100g)', 69, 0, 17, 0);
INSERT INTO CALORIE VALUES ('Fruit sec', 'Abricots secs Maître prunille (100g)', 172, 3.4, 33.8, 0.5);
INSERT INTO CALORIE VALUES ('Boisson', 'Ace-the Carrefour light (un verre)', 100, 45, 25, 1);
INSERT INTO CALORIE VALUES ('Conserve', 'Achards de légumes le coq noir pot de 340gr (100g)', 291, 1.25, 7.58, 28.4);
INSERT INTO CALORIE VALUES ('Confiserie', 'Acidulés fruits, confiserie du domaine Leclerc marque repère (100g)', 382, 0, 93, 0);
INSERT INTO CALORIE VALUES ('Plat cuisiné', 'Acras de morue (moyenne) (100g)', 228, 11, 19, 12);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actifidus "délisse" saveur vanille (100g)', 90, 3.7, 11.8, 3.1);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actifidus "délisse" saveur vanille (un pot)', 111, 4.6, 14.7, 3.8);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actifidus nature Leclerc marque repère (un pot)', 78, 4.63, 5.13, 4.38);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actiform (boisson fruits mixés) champion (100g)', 55, 0.6, 13.2, 0);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actiform fruits mixés "ananas coco" (champion) (100g)', 55, 0.6, 13.2, 0);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actiform fruits mixés "pêche mangue" (champion) (100g)', 51, 0.6, 12.2, 0);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actimel (0% fruits rouges) Danone (100g)', 29, 2.7, 3.7, 0.1);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actimel (0% nature) Danone (100g)', 28, 2.8, 3.1, 0.1);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actimel 0 % saveur fruits rouges Danone (100g)', 29, 2.7, 3.7, 0.05);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actimel 0% ananas Danone (100g)', 32, 2, 4, 0);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actimel fraise Danone (100g)', 85, 2, 13, 1);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actimel multrifruits Danone (100g)', 76, 2.9, 12, 1.5);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actimel nature Danone (100g)', 80, 3, 15.1, 1.7);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actimel orange Danone (100g)', 80, 2, 13, 1);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actimel pêche gelée royale Danone (100g)', 76, 2.9, 11.8, 1.5);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actimel Saveur pêche-gelée royale (100g)', 76, 2.9, 11.8, 1.5);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actimel vanille Danone (100g)', 88, 2, 15, 1);
INSERT INTO CALORIE VALUES ('Yaourt', 'Actimle multifruits (100g)', 85, 2, 14, 1);
INSERT INTO CALORIE VALUES ('Pain/Baguette', 'Active sandwich Lidl (100g)', 264, 7.5, 46, 5.5);
INSERT INTO CALORIE VALUES ('Yaourt', 'Activia 0% ananas Danone (un pot)', 64, 6, 9.8, 0.13);
INSERT INTO CALORIE VALUES ('Yaourt', 'Activia 0% fraises Activia (125g)', 64, 6.1, 9.6, 0.13);
INSERT INTO CALORIE VALUES ('Plat cuisiné', 'Aiguillettes de poulet marinées au citron Picard (un paquet)', 142, 0, 1.6, 3.1);
INSERT INTO CALORIE VALUES ('Plat cuisiné', 'Aiguillettes de poulet marinées thym-citron père dodu (100g)', 118, 22.3, 1, 3.3);
INSERT INTO CALORIE VALUES ('Plat cuisiné', 'Aiguillettes de poulet père dodu (100g)', 102, 22.8, 0.8, 1);
INSERT INTO CALORIE VALUES ('Légume', 'Ail (100g)', 138, 6, 28, 0);
INSERT INTO CALORIE VALUES ('Fromage', 'Ail et fines herbes Boursin (100g)', 405, 7, 2, 41);
INSERT INTO CALORIE VALUES ('Poisson', 'Aile de raie "poisson" (100g)', 91, 20.7, 0, 1);
INSERT INTO CALORIE VALUES ('Fromage', 'Ailladou 7% mg Casino (100g)', 134, 14, 3.7, 7);
INSERT INTO CALORIE VALUES ('Céréale', 'All bran mini breaks cannelle (une portion)', 96, 17, 8, 7);
INSERT INTO CALORIE VALUES ('Céréale', 'All bran chocolat (100g)', 382, 9, 64, 10);
INSERT INTO CALORIE VALUES ('Céréale', 'All bran fique et pomme kelloggs (100g)', 318, 9, 66, 2);
INSERT INTO CALORIE VALUES ('Céréale', 'All-bran chocolat Kelloggs (100g)', 354, 10, 65, 6);
INSERT INTO CALORIE VALUES ('Céréale', 'All-bran fibre + Kelloggs (100g)', 280, 14, 48, 3.5);
INSERT INTO CALORIE VALUES ('Céréale', 'All-bran fibre plus Kelloggs (100g)', 280, 14, 48, 3.5);
INSERT INTO CALORIE VALUES ('Céréale', 'All-bran figue et pomme Kelloggs (100g)', 327, 9, 67, 2.5);
INSERT INTO CALORIE VALUES ('Céréale', 'All-bran fruit n fibre Kelloggs (100g)', 358, 8, 68, 6);
INSERT INTO CALORIE VALUES ('Céréale', 'All-bran fruits et fibres Kelloggs (100g)', 358, 8, 68, 6);
INSERT INTO CALORIE VALUES ('Céréale', 'All-bran pétales Kelloggs (100g)', 326, 10, 67, 2);
INSERT INTO CALORIE VALUES ('Céréale', 'All-bran pétales Kelloggs (une portion)', 78.6, 3.6, 3.7, 1);
INSERT INTO CALORIE VALUES ('Céréale', 'All-bran snack bites Kelloggs (une portion)', 100, 2, 21, 4.5);
INSERT INTO CALORIE VALUES (NULL, 'Allumettes de Canard CARREFOUR 2x80Grs (100g)', 104, 18, 1.6, 2.8);
INSERT INTO CALORIE VALUES (NULL, 'Allumettes de jambon fleury michon (100g)', 114, 17, 2.5, 4);
INSERT INTO CALORIE VALUES (NULL, 'Allumettes de lardons fumés Ondilège - 25 % de sel (100g)', 276, 17, 0.2, 23);
INSERT INTO CALORIE VALUES (NULL, 'Allumettes de lardons fumés Ondilège - 25 % de sel, une portion de 50 g (100g)', 138, 8.5, 0.2, 11.5);
INSERT INTO CALORIE VALUES (NULL, 'Allumettes de volaille 2x75g fleury michon (100g)', 118, 19, 1.5, 4);
INSERT INTO CALORIE VALUES (NULL, 'Allumettes lardons Auchan (un paquet)', 287, 17, 0.8, 24);
INSERT INTO CALORIE VALUES ('Poisson', 'Alose (100g)', 170, 20, 0, 10);
INSERT INTO CALORIE VALUES ('Viande', 'Aloyau de boeuf (100g)', 266, 17, 0, 22);
INSERT INTO CALORIE VALUES ('Viande', 'Aloyau de veau (100g)', 175, 19, 0, 11);
