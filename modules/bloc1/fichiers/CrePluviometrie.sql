-- Stations pluviométriques de MétéoSuisse - script MySQL (UTF-8)
/* CREATE DATABASE BDPLUVIO CHARACTER SET utf8mb4;
USE BDPLUVIO; */

CREATE TABLE Pluvio (
  ISM            INTEGER     NOT NULL,
  NomStation     VARCHAR(50) NOT NULL,
  altitude       INTEGER     NOT NULL,
  precipitation  INTEGER     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE Pluvio ADD CONSTRAINT PkPluvio PRIMARY KEY (ISM);

INSERT INTO Pluvio (ISM, NomStation, altitude, precipitation) VALUES (5720, 'Romont', 688, 1128);
INSERT INTO Pluvio (ISM, NomStation, altitude, precipitation) VALUES (5830, 'Semsales', 873, 1511);
INSERT INTO Pluvio (ISM, NomStation, altitude, precipitation) VALUES (5870, 'Moudon-Ville', 525, 1102);
INSERT INTO Pluvio (ISM, NomStation, altitude, precipitation) VALUES (5900, 'Payerne-Ville', 450, 900);
INSERT INTO Pluvio (ISM, NomStation, altitude, precipitation) VALUES (6137, 'Villars-Tiercellin', 850, 1343);
INSERT INTO Pluvio (ISM, NomStation, altitude, precipitation) VALUES (6150, 'Thierrens', 770, 1061);
INSERT INTO Pluvio (ISM, NomStation, altitude, precipitation) VALUES (6160, 'Chanéaz', 758, 1005);
INSERT INTO Pluvio (ISM, NomStation, altitude, precipitation) VALUES (6170, 'Châbles (FR)', 589, 1014);
INSERT INTO Pluvio (ISM, NomStation, altitude, precipitation) VALUES (8025, 'Fruence', 830, 1656);
