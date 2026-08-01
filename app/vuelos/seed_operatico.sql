SET NAMES utf8mb4;

START TRANSACTION;

INSERT INTO aeronaves (codigo, modelo, capacidad, estado, creado_en, actualizado_en)
SELECT 'FT-001', 'Airbus A320', 150, 'ACTIVA', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM aeronaves WHERE codigo = 'FT-001'
);

INSERT INTO aeronaves (codigo, modelo, capacidad, estado, creado_en, actualizado_en)
SELECT 'FT-002', 'Boeing 737-800', 120, 'ACTIVA', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM aeronaves WHERE codigo = 'FT-002'
);

INSERT INTO aeronaves (codigo, modelo, capacidad, estado, creado_en, actualizado_en)
SELECT 'FT-003', 'Embraer E190', 90, 'ACTIVA', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM aeronaves WHERE codigo = 'FT-003'
);

INSERT INTO aeronaves (codigo, modelo, capacidad, estado, creado_en, actualizado_en)
SELECT 'FT-004', 'Airbus A319', 100, 'INACTIVA', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM aeronaves WHERE codigo = 'FT-004'
);

INSERT INTO rutas (origen, destino, estado, creado_en, actualizado_en)
SELECT 'San José', 'Ciudad de México', 'ACTIVA', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM rutas
    WHERE origen = 'San José' AND destino = 'Ciudad de México'
);

INSERT INTO rutas (origen, destino, estado, creado_en, actualizado_en)
SELECT 'San José', 'Bogotá', 'ACTIVA', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM rutas
    WHERE origen = 'San José' AND destino = 'Bogotá'
);

INSERT INTO rutas (origen, destino, estado, creado_en, actualizado_en)
SELECT 'San José', 'Madrid', 'ACTIVA', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM rutas
    WHERE origen = 'San José' AND destino = 'Madrid'
);

SET @aeronave_1 = (SELECT id FROM aeronaves WHERE codigo = 'FT-001' LIMIT 1);
SET @aeronave_2 = (SELECT id FROM aeronaves WHERE codigo = 'FT-002' LIMIT 1);
SET @aeronave_3 = (SELECT id FROM aeronaves WHERE codigo = 'FT-003' LIMIT 1);

SET @ruta_1 = (
    SELECT id FROM rutas
    WHERE origen = 'San José' AND destino = 'Ciudad de México'
    LIMIT 1
);

SET @ruta_2 = (
    SELECT id FROM rutas
    WHERE origen = 'San José' AND destino = 'Bogotá'
    LIMIT 1
);

SET @ruta_3 = (
    SELECT id FROM rutas
    WHERE origen = 'San José' AND destino = 'Madrid'
    LIMIT 1
);

-- Vuelo disponible 1
INSERT INTO vuelos (
    ruta_id, aeronave_id, fecha, hora, precio_base,
    estado, cupos_disponibles, creado_en, actualizado_en
)
SELECT
    @ruta_1, @aeronave_1, '2026-08-15', '08:30:00', 185.00,
    'ACTIVO', 150, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM vuelos
    WHERE ruta_id = @ruta_1
      AND fecha = '2026-08-15'
      AND hora = '08:30:00'
);

-- Vuelo disponible 2
INSERT INTO vuelos (
    ruta_id, aeronave_id, fecha, hora, precio_base,
    estado, cupos_disponibles, creado_en, actualizado_en
)
SELECT
    @ruta_2, @aeronave_2, '2026-08-20', '10:15:00', 220.00,
    'PROGRAMADO', 120, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM vuelos
    WHERE ruta_id = @ruta_2
      AND fecha = '2026-08-20'
      AND hora = '10:15:00'
);

-- Vuelo disponible 3
INSERT INTO vuelos (
    ruta_id, aeronave_id, fecha, hora, precio_base,
    estado, cupos_disponibles, creado_en, actualizado_en
)
SELECT
    @ruta_3, @aeronave_3, '2026-09-05', '16:45:00', 950.00,
    'PROGRAMADO', 90, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM vuelos
    WHERE ruta_id = @ruta_3
      AND fecha = '2026-09-05'
      AND hora = '16:45:00'
);

-- Vuelo cerrado para pruebas administrativas
INSERT INTO vuelos (
    ruta_id, aeronave_id, fecha, hora, precio_base,
    estado, cupos_disponibles, creado_en, actualizado_en
)
SELECT
    @ruta_1, @aeronave_2, '2026-08-10', '06:00:00', 150.00,
    'CERRADO', 0, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM vuelos
    WHERE ruta_id = @ruta_1
      AND fecha = '2026-08-10'
      AND hora = '06:00:00'
);

-- Vuelo cancelado para pruebas administrativas
INSERT INTO vuelos (
    ruta_id, aeronave_id, fecha, hora, precio_base,
    estado, cupos_disponibles, creado_en, actualizado_en
)
SELECT
    @ruta_2, @aeronave_3, '2026-08-12', '14:00:00', 210.00,
    'CANCELADO', 0, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM vuelos
    WHERE ruta_id = @ruta_2
      AND fecha = '2026-08-12'
      AND hora = '14:00:00'
);

-- ============================================================
-- Generación de asientos
-- ============================================================

SET @vuelo_1 = (
    SELECT id FROM vuelos
    WHERE ruta_id = @ruta_1
      AND fecha = '2026-08-15'
      AND hora = '08:30:00'
    LIMIT 1
);

SET @vuelo_2 = (
    SELECT id FROM vuelos
    WHERE ruta_id = @ruta_2
      AND fecha = '2026-08-20'
      AND hora = '10:15:00'
    LIMIT 1
);

SET @vuelo_3 = (
    SELECT id FROM vuelos
    WHERE ruta_id = @ruta_3
      AND fecha = '2026-09-05'
      AND hora = '16:45:00'
    LIMIT 1
);

SET @vuelo_4 = (
    SELECT id FROM vuelos
    WHERE ruta_id = @ruta_1
      AND fecha = '2026-08-10'
      AND hora = '06:00:00'
    LIMIT 1
);

SET @vuelo_5 = (
    SELECT id FROM vuelos
    WHERE ruta_id = @ruta_2
      AND fecha = '2026-08-12'
      AND hora = '14:00:00'
    LIMIT 1
);

-- Para que el script sea repetible, solo crea asientos si el vuelo
-- todavía no tiene asientos.
INSERT INTO asientos (
    vuelo_id, numero, estado, creado_en, actualizado_en
)
SELECT
    @vuelo_1, n, 'DISPONIBLE', NOW(), NOW()
FROM (
    WITH RECURSIVE numeros AS (
        SELECT 1 AS n
        UNION ALL
        SELECT n + 1 FROM numeros WHERE n < 150
    )
    SELECT n FROM numeros
) AS serie
WHERE @vuelo_1 IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM asientos WHERE vuelo_id = @vuelo_1
  );

INSERT INTO asientos (
    vuelo_id, numero, estado, creado_en, actualizado_en
)
SELECT
    @vuelo_2, n, 'DISPONIBLE', NOW(), NOW()
FROM (
    WITH RECURSIVE numeros AS (
        SELECT 1 AS n
        UNION ALL
        SELECT n + 1 FROM numeros WHERE n < 120
    )
    SELECT n FROM numeros
) AS serie
WHERE @vuelo_2 IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM asientos WHERE vuelo_id = @vuelo_2
  );

INSERT INTO asientos (
    vuelo_id, numero, estado, creado_en, actualizado_en
)
SELECT
    @vuelo_3, n, 'DISPONIBLE', NOW(), NOW()
FROM (
    WITH RECURSIVE numeros AS (
        SELECT 1 AS n
        UNION ALL
        SELECT n + 1 FROM numeros WHERE n < 90
    )
    SELECT n FROM numeros
) AS serie
WHERE @vuelo_3 IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM asientos WHERE vuelo_id = @vuelo_3
  );

INSERT INTO asientos (
    vuelo_id, numero, estado, creado_en, actualizado_en
)
SELECT
    @vuelo_4, n, 'DISPONIBLE', NOW(), NOW()
FROM (
    WITH RECURSIVE numeros AS (
        SELECT 1 AS n
        UNION ALL
        SELECT n + 1 FROM numeros WHERE n < 120
    )
    SELECT n FROM numeros
) AS serie
WHERE @vuelo_4 IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM asientos WHERE vuelo_id = @vuelo_4
  );

INSERT INTO asientos (
    vuelo_id, numero, estado, creado_en, actualizado_en
)
SELECT
    @vuelo_5, n, 'DISPONIBLE', NOW(), NOW()
FROM (
    WITH RECURSIVE numeros AS (
        SELECT 1 AS n
        UNION ALL
        SELECT n + 1 FROM numeros WHERE n < 90
    )
    SELECT n FROM numeros
) AS serie
WHERE @vuelo_5 IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM asientos WHERE vuelo_id = @vuelo_5
  );

COMMIT;

-- Verificación rápida
SELECT
    v.id AS vuelo,
    r.origen,
    r.destino,
    v.fecha,
    v.hora,
    v.estado,
    v.cupos_disponibles,
    COUNT(a.id) AS asientos_registrados
FROM vuelos v
JOIN rutas r ON r.id = v.ruta_id
LEFT JOIN asientos a ON a.vuelo_id = v.id
GROUP BY
    v.id, r.origen, r.destino, v.fecha, v.hora,
    v.estado, v.cupos_disponibles
ORDER BY v.fecha, v.hora;
