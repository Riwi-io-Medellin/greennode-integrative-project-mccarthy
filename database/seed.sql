-- Roles
INSERT INTO role (name) VALUES ('admin'), ('client') ON CONFLICT (name) DO NOTHING;

-- Territories
INSERT INTO territory (name, seedling_capacity, access_difficulty, water_availability, city) VALUES
('Cordillera de los Andes, Zona Sur', 50000, 'Media', 'Alta', 'Pasto'),
('Costa Caribe, Zona Norte', 30000, 'Baja', 'Media', 'Barranquilla'),
('Valle del Magdalena Medio', 80000, 'Alta', 'Alta', 'Barrancabermeja'),
('Humedales Urbanos - Bogotá', 20000, 'Baja', 'Alta', 'Bogotá'),
('Piedemonte Amazónico', 60000, 'Alta', 'Alta', 'Florencia'),
('Páramo Chingaza', 15000, 'Alta', 'Alta', 'Cundinamarca')
ON CONFLICT DO NOTHING;

-- Species
INSERT INTO species (name, growth_rate, unit_price, survival_rate, ecosystem_service, type) VALUES
('Roble andino', 'slow', 15000, 94, 'Captura de carbono y biodiversidad andina', 'native'),
('Cedro rojo', 'medium', 12000, 88, 'Madera y regulación de servicios hídricos', 'native'),
('Pino romerón', 'medium', 10000, 91, 'Regulación hídrica en zonas de páramo', 'native'),
('Aliso', 'fast', 8000, 96, 'Fijación de nitrógeno y crecimiento rápido', 'native'),
('Guadua', 'fast', 6000, 97, 'Captura de CO2 y control de erosión hídrica', 'native'),
('Yarumo', 'fast', 7000, 89, 'Especie pionera para recuperación de suelos degradados', 'pioneer'),
('Eucalipto', 'fast', 5000, 85, 'Cobertura rápida de áreas intervenidas', 'exotic'),
('Acacia negra', 'fast', 6500, 90, 'Fijación de nitrógeno y restauración de suelos', 'exotic')
ON CONFLICT DO NOTHING;

-- Territory-species associations
INSERT INTO territory_species (territory_id, species_id) VALUES
(1,1),(1,2),(1,3),(1,4),
(2,2),(2,5),(2,6),(2,7),
(3,4),(3,5),(3,6),(3,7),
(4,1),(4,4),(4,6),
(5,4),(5,5),(5,6),(5,8),
(6,1),(6,3),(6,4)
ON CONFLICT DO NOTHING;
