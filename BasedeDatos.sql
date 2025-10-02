-- =====================================================
-- BASE DE DATOS HACCP - SISTEMA COMPLETO Y FUNCIONAL
-- Diseñada para capturar TODOS los campos de los formularios HACCP
-- =====================================================

-- =====================================================
-- MÓDULO 1: USUARIOS Y AUTENTICACIÓN
-- =====================================================

CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    nombre_completo VARCHAR(200) GENERATED ALWAYS AS (nombre || ' ' || apellido) VIRTUAL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK(rol IN ('ADMIN', 'SUPERVISOR', 'COCINERO', 'EMPLEADO')),
    cargo VARCHAR(100),
    area VARCHAR(50) CHECK(area IN ('COCINA', 'SALON', 'ADMINISTRACION', 'ALMACEN')),
    activo BOOLEAN DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE turnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(20) NOT NULL CHECK(nombre IN ('MAÑANA', 'TARDE', 'NOCHE')),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT 1
);

-- =====================================================
-- MÓDULO 2: ASISTENCIA Y FICHADO
-- =====================================================

CREATE TABLE asistencia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    hora_entrada TIME,
    hora_salida TIME,
    horas_trabajadas DECIMAL(5,2),
    turno_id INTEGER,
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8),
    ubicacion_valida BOOLEAN DEFAULT 0,
    codigo_qr VARCHAR(50),
    metodo_fichado VARCHAR(20) CHECK(metodo_fichado IN ('MANUAL', 'GPS', 'QR')),
    estado VARCHAR(20) CHECK(estado IN ('PUNTUAL', 'TARDANZA', 'FALTA')),
    observaciones TEXT,
    timestamp_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (turno_id) REFERENCES turnos(id)
);

CREATE TABLE codigos_qr_locales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    ubicacion VARCHAR(100) NOT NULL,
    descripcion TEXT,
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8),
    radio_metros INTEGER DEFAULT 100,
    activo BOOLEAN DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MÓDULO 3: PROVEEDORES Y PRODUCTOS
-- =====================================================

CREATE TABLE proveedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_completo VARCHAR(200) NOT NULL,
    razon_social VARCHAR(200),
    ruc VARCHAR(20),
    contacto_nombre VARCHAR(100),
    contacto_telefono VARCHAR(20),
    contacto_email VARCHAR(100),
    direccion TEXT,
    tipo_productos VARCHAR(100),
    calificacion_promedio DECIMAL(3,2),
    activo BOOLEAN DEFAULT 1,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT
);

CREATE TABLE categorias_productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) CHECK(tipo IN ('FRUTAS_VERDURAS', 'ABARROTES', 'CARNES', 'LACTEOS', 'PESCADOS', 'OTROS')),
    descripcion TEXT
);

CREATE TABLE productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    categoria_id INTEGER,
    unidad_medida VARCHAR(20) CHECK(unidad_medida IN ('KG', 'UNIDAD', 'CAJA', 'GRAMOS', 'LITROS', 'PAQUETE', 'LATA')),
    descripcion TEXT,
    requiere_refrigeracion BOOLEAN DEFAULT 0,
    requiere_registro_sanitario BOOLEAN DEFAULT 0,
    temperatura_almacenamiento VARCHAR(50),
    activo BOOLEAN DEFAULT 1,
    FOREIGN KEY (categoria_id) REFERENCES categorias_productos(id)
);

-- =====================================================
-- MÓDULO 4: CONTROL DE RECEPCIÓN DE MERCADERÍA
-- =====================================================

-- Tabla unificada para frutas/verduras y abarrotes
-- Los campos específicos se llenan según el tipo
CREATE TABLE control_recepcion_mercaderia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- DATOS DEL PERÍODO
    mes INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    
    -- TIPO DE CONTROL
    tipo_control VARCHAR(50) CHECK(tipo_control IN ('FRUTAS_VERDURAS', 'ABARROTES')) NOT NULL,
    
    -- DATOS DE RECEPCIÓN
    proveedor_id INTEGER NOT NULL,
    nombre_proveedor VARCHAR(200), -- Copia del nombre para historial
    producto_id INTEGER NOT NULL,
    nombre_producto VARCHAR(100), -- Copia del nombre para historial
    
    -- CANTIDADES
    cantidad_solicitada DECIMAL(10,2),
    peso_unidad_recibido DECIMAL(10,2) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL,
    
    -- ===== CAMPOS ESPECÍFICOS PARA FRUTAS Y VERDURAS =====
    estado_producto VARCHAR(20) CHECK(estado_producto IN ('EXCELENTE', 'REGULAR', 'PESIMO')),
    conformidad_integridad_producto VARCHAR(20) CHECK(conformidad_integridad_producto IN ('EXCELENTE', 'REGULAR', 'PESIMO')),
    
    -- ===== CAMPOS ESPECÍFICOS PARA ABARROTES =====
    registro_sanitario_vigente BOOLEAN,
    fecha_vencimiento_producto DATE,
    evaluacion_vencimiento VARCHAR(20) CHECK(evaluacion_vencimiento IN ('EXCELENTE', 'REGULAR', 'PESIMO')),
    -- EXCELENTE: >6 meses, REGULAR: 1-6 meses, PESIMO: <1 mes
    conformidad_empaque_primario VARCHAR(20) CHECK(conformidad_empaque_primario IN ('EXCELENTE', 'REGULAR', 'PESIMO')),
    
    -- ===== EVALUACIONES COMUNES (para ambos tipos) =====
    uniforme_completo VARCHAR(2) CHECK(uniforme_completo IN ('C', 'NC')),
    transporte_adecuado VARCHAR(2) CHECK(transporte_adecuado IN ('C', 'NC')),
    puntualidad VARCHAR(2) CHECK(puntualidad IN ('C', 'NC')),
    
    -- RESPONSABLES
    responsable_registro_id INTEGER NOT NULL,
    responsable_registro_nombre VARCHAR(200), -- Nombre y cargo
    responsable_supervision_id INTEGER NOT NULL,
    responsable_supervision_nombre VARCHAR(200), -- Nombre y cargo
    
    -- OBSERVACIONES Y ACCIONES
    observaciones TEXT,
    accion_correctiva TEXT,
    producto_rechazado BOOLEAN DEFAULT 0,
    
    -- AUDITORÍA
    timestamp_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    timestamp_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (responsable_registro_id) REFERENCES usuarios(id),
    FOREIGN KEY (responsable_supervision_id) REFERENCES usuarios(id)
);

-- =====================================================
-- MÓDULO 5: CONTROL DE COCCIÓN
-- =====================================================

CREATE TABLE control_coccion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- DATOS DEL PERÍODO
    mes INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    dia INTEGER NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    
    -- PRODUCTO Y PROCESO
    producto_cocinar VARCHAR(50) CHECK(producto_cocinar IN ('POLLO', 'CARNE', 'PESCADO', 'HAMBURGUESA', 'PIZZA')) NOT NULL,
    proceso_coccion VARCHAR(1) CHECK(proceso_coccion IN ('H', 'P', 'C')) NOT NULL,
    -- H: Horno, P: Plancha, C: Cocina
    
    -- PARÁMETROS DE COCCIÓN
    temperatura_coccion DECIMAL(5,2) NOT NULL,
    -- Debe ser Mayor a 80°C
    tiempo_coccion_minutos INTEGER NOT NULL,
    
    -- CONFORMIDAD (calculada automáticamente)
    conformidad VARCHAR(2) CHECK(conformidad IN ('C', 'NC')),
    -- C si temperatura > 80°C, NC si no
    
    -- ACCIÓN CORRECTIVA
    accion_correctiva TEXT,
    
    -- RESPONSABLE (llenado automático con usuario logueado)
    responsable_id INTEGER NOT NULL,
    responsable_nombre VARCHAR(200),
    
    -- AUDITORÍA
    timestamp_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (responsable_id) REFERENCES usuarios(id)
);

-- =====================================================
-- MÓDULO 6: CONTROL DE LAVADO Y DESINFECCIÓN DE FRUTAS Y VERDURAS
-- =====================================================

CREATE TABLE control_lavado_desinfeccion_frutas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- DATOS DEL PERÍODO
    mes INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    dia INTEGER NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    
    -- PRODUCTO QUÍMICO
    producto_quimico VARCHAR(50) NOT NULL,
    concentracion_producto DECIMAL(5,2) NOT NULL,
    
    -- CONFORMIDAD DEL PROCESO
    nombre_fruta_verdura VARCHAR(100) NOT NULL,
    lavado_agua_potable VARCHAR(2) CHECK(lavado_agua_potable IN ('C', 'NC')) NOT NULL,
    desinfeccion_producto_quimico VARCHAR(2) CHECK(desinfeccion_producto_quimico IN ('C', 'NC')) NOT NULL,
    concentracion_correcta VARCHAR(2) CHECK(concentracion_correcta IN ('C', 'NC')) NOT NULL,
    tiempo_desinfeccion_minutos INTEGER CHECK(tiempo_desinfeccion_minutos BETWEEN 0 AND 10) NOT NULL,
    
    -- ACCIONES CORRECTIVAS
    acciones_correctivas TEXT,
    
    -- SUPERVISOR
    supervisor_id INTEGER NOT NULL,
    supervisor_nombre VARCHAR(200),
    
    -- AUDITORÍA
    timestamp_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (supervisor_id) REFERENCES usuarios(id)
);

-- =====================================================
-- MÓDULO 7: CONTROL DE LAVADO Y DESINFECCIÓN DE MANOS
-- =====================================================

CREATE TABLE control_lavado_manos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- DATOS DEL PERÍODO
    mes INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    
    -- ÁREA O ESTACIÓN
    area_estacion VARCHAR(20) CHECK(area_estacion IN ('COCINA', 'SALON')) NOT NULL,
    
    -- TURNO
    turno VARCHAR(20) CHECK(turno IN ('MAÑANA', 'TARDE')) NOT NULL,
    
    -- EMPLEADO QUE SE LAVA LAS MANOS
    empleado_id INTEGER NOT NULL,
    nombres_apellidos VARCHAR(200) NOT NULL,
    firma TEXT, -- Puede ser firma digital o imagen base64
    
    -- CONFORMIDAD DEL PROCEDIMIENTO
    procedimiento_correcto VARCHAR(2) CHECK(procedimiento_correcto IN ('C', 'NC')) NOT NULL,
    
    -- ACCIÓN CORRECTIVA
    accion_correctiva TEXT,
    
    -- SUPERVISOR
    supervisor_id INTEGER NOT NULL,
    supervisor_nombre VARCHAR(200),
    
    -- AUDITORÍA
    timestamp_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (empleado_id) REFERENCES usuarios(id),
    FOREIGN KEY (supervisor_id) REFERENCES usuarios(id)
);

-- =====================================================
-- MÓDULO 8: CONTROL DE TEMPERATURA DE CÁMARAS
-- =====================================================

CREATE TABLE camaras_frigorificas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(50) NOT NULL,
    tipo VARCHAR(20) CHECK(tipo IN ('REFRIGERACION', 'CONGELACION')) NOT NULL,
    numero_camara INTEGER NOT NULL,
    
    -- Rangos de temperatura según tipo
    temperatura_minima DECIMAL(5,2),
    temperatura_maxima DECIMAL(5,2),
    -- REFRIGERACIÓN: 1°C a 4°C
    -- CONGELACIÓN: < -18°C
    
    ubicacion VARCHAR(100),
    activo BOOLEAN DEFAULT 1,
    
    UNIQUE(tipo, numero_camara)
);

-- IMPORTANTE: Cada registro = UN DÍA para UNA cámara
-- Se registran 2 turnos (mañana y tarde) en el mismo registro
CREATE TABLE control_temperatura_camaras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- DATOS DEL PERÍODO
    mes INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    dia INTEGER NOT NULL,
    fecha DATE NOT NULL,
    
    -- CÁMARA ESPECÍFICA
    camara_id INTEGER NOT NULL,
    
    -- ===== TURNO MAÑANA (08:00) =====
    hora_manana TIME DEFAULT '08:00',
    temperatura_manana DECIMAL(5,2),
    responsable_manana_id INTEGER,
    responsable_manana_nombre VARCHAR(200),
    conformidad_manana VARCHAR(2) CHECK(conformidad_manana IN ('C', 'NC')),
    
    -- ===== TURNO TARDE (16:00) =====
    hora_tarde TIME DEFAULT '16:00',
    temperatura_tarde DECIMAL(5,2),
    responsable_tarde_id INTEGER,
    responsable_tarde_nombre VARCHAR(200),
    conformidad_tarde VARCHAR(2) CHECK(conformidad_tarde IN ('C', 'NC')),
    
    -- ACCIONES CORRECTIVAS ESTÁNDAR
    acciones_correctivas TEXT,
    
    -- SUPERVISOR
    supervisor_id INTEGER,
    supervisor_nombre VARCHAR(200),
    
    -- AUDITORÍA
    timestamp_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    timestamp_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Un solo registro por cámara por día
    UNIQUE(camara_id, fecha),
    
    FOREIGN KEY (camara_id) REFERENCES camaras_frigorificas(id),
    FOREIGN KEY (responsable_manana_id) REFERENCES usuarios(id),
    FOREIGN KEY (responsable_tarde_id) REFERENCES usuarios(id),
    FOREIGN KEY (supervisor_id) REFERENCES usuarios(id)
);

-- =====================================================
-- MÓDULO 9: AUDITORÍA Y LOGS
-- =====================================================

CREATE TABLE auditoria_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    usuario_nombre VARCHAR(200),
    accion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id INTEGER,
    datos_anteriores TEXT,
    datos_nuevos TEXT,
    ip_address VARCHAR(45),
    timestamp_accion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
-- =====================================================

-- Índices para asistencia
CREATE INDEX idx_asistencia_usuario_fecha ON asistencia(usuario_id, fecha);
CREATE INDEX idx_asistencia_fecha ON asistencia(fecha);
CREATE INDEX idx_asistencia_estado ON asistencia(estado);

-- Índices para recepción de mercadería
CREATE INDEX idx_recepcion_fecha ON control_recepcion_mercaderia(fecha);
CREATE INDEX idx_recepcion_tipo ON control_recepcion_mercaderia(tipo_control);
CREATE INDEX idx_recepcion_proveedor ON control_recepcion_mercaderia(proveedor_id);
CREATE INDEX idx_recepcion_mes_anio ON control_recepcion_mercaderia(mes, anio);

-- Índices para cocción
CREATE INDEX idx_coccion_fecha ON control_coccion(fecha);
CREATE INDEX idx_coccion_producto ON control_coccion(producto_cocinar);
CREATE INDEX idx_coccion_mes_anio ON control_coccion(mes, anio);

-- Índices para lavado de frutas
CREATE INDEX idx_lavado_frutas_fecha ON control_lavado_desinfeccion_frutas(fecha);
CREATE INDEX idx_lavado_frutas_mes_anio ON control_lavado_desinfeccion_frutas(mes, anio);

-- Índices para lavado de manos
CREATE INDEX idx_lavado_manos_fecha ON control_lavado_manos(fecha);
CREATE INDEX idx_lavado_manos_empleado ON control_lavado_manos(empleado_id);
CREATE INDEX idx_lavado_manos_mes_anio ON control_lavado_manos(mes, anio);

-- Índices para temperatura
CREATE INDEX idx_temperatura_fecha ON control_temperatura_camaras(fecha);
CREATE INDEX idx_temperatura_camara ON control_temperatura_camaras(camara_id);
CREATE INDEX idx_temperatura_mes_anio ON control_temperatura_camaras(mes, anio);

-- Índices para usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- =====================================================
-- DATOS INICIALES DEL SISTEMA
-- =====================================================

-- Insertar turnos predefinidos
INSERT INTO turnos (nombre, hora_inicio, hora_fin, descripcion) VALUES
('MAÑANA', '06:00', '14:00', 'Turno matutino'),
('TARDE', '14:00', '22:00', 'Turno vespertino'),
('NOCHE', '22:00', '06:00', 'Turno nocturno');

-- Insertar usuarios iniciales
-- Nota: Las contraseñas deben ser hasheadas con bcrypt en la aplicación
INSERT INTO usuarios (nombre, apellido, email, password, rol, cargo, area) VALUES
('Administrador', 'Sistema', 'admin@hotel.com', '$2a$10$hashedpassword', 'ADMIN', 'Administrador General', 'ADMINISTRACION'),
('Juan', 'Pérez', 'supervisor@hotel.com', '$2a$10$hashedpassword', 'SUPERVISOR', 'Supervisor de Cocina', 'COCINA'),
('María', 'García', 'cocinero1@hotel.com', '$2a$10$hashedpassword', 'COCINERO', 'Cocinero Principal', 'COCINA'),
('Pedro', 'López', 'empleado1@hotel.com', '$2a$10$hashedpassword', 'EMPLEADO', 'Ayudante de Cocina', 'COCINA'),
('Ana', 'Martínez', 'empleado2@hotel.com', '$2a$10$hashedpassword', 'EMPLEADO', 'Ayudante de Salón', 'SALON');

-- Insertar categorías de productos
INSERT INTO categorias_productos (nombre, tipo, descripcion) VALUES
('Frutas Frescas', 'FRUTAS_VERDURAS', 'Manzanas, naranjas, plátanos, etc.'),
('Verduras y Hortalizas', 'FRUTAS_VERDURAS', 'Lechugas, tomates, zanahorias, etc.'),
('Granos y Cereales', 'ABARROTES', 'Arroz, quinua, avena, fideos'),
('Conservas y Enlatados', 'ABARROTES', 'Atún, verduras enlatadas, etc.'),
('Aceites y Grasas', 'ABARROTES', 'Aceite vegetal, manteca, etc.'),
('Carnes Rojas', 'CARNES', 'Res, cerdo, cordero'),
('Carnes Blancas', 'CARNES', 'Pollo, pavo'),
('Pescados y Mariscos', 'PESCADOS', 'Pescado fresco, congelado, mariscos'),
('Lácteos', 'LACTEOS', 'Leche, queso, yogurt, mantequilla');

-- Insertar productos de ejemplo
INSERT INTO productos (nombre, categoria_id, unidad_medida, requiere_refrigeracion, requiere_registro_sanitario) VALUES
('Manzanas', 1, 'KG', 1, 0),
('Lechugas', 2, 'UNIDAD', 1, 0),
('Tomates', 2, 'KG', 1, 0),
('Arroz', 3, 'KG', 0, 1),
('Aceite Vegetal', 5, 'LITROS', 0, 1),
('Atún en Conserva', 4, 'LATA', 0, 1),
('Fideos', 3, 'PAQUETE', 0, 1),
('Pollo Entero', 7, 'UNIDAD', 1, 1),
('Carne de Res', 6, 'KG', 1, 1),
('Pescado Fresco', 8, 'KG', 1, 1);

-- Insertar proveedores de ejemplo
INSERT INTO proveedores (nombre_completo, razon_social, ruc, tipo_productos) VALUES
('Distribuidora San Jorge S.A.C.', 'Distribuidora San Jorge S.A.C.', '20123456789', 'Frutas y Verduras'),
('Abarrotes del Norte E.I.R.L.', 'Abarrotes del Norte E.I.R.L.', '20987654321', 'Abarrotes en General'),
('Carnes Premium S.A.', 'Carnes Premium S.A.', '20456789123', 'Carnes y Embutidos'),
('Pescadería El Puerto', 'Pescadería El Puerto S.R.L.', '20789123456', 'Pescados y Mariscos');

-- Insertar cámaras frigoríficas
INSERT INTO camaras_frigorificas (nombre, tipo, numero_camara, temperatura_minima, temperatura_maxima) VALUES
('REFRIGERACIÓN 1', 'REFRIGERACION', 1, 1.0, 4.0),
('REFRIGERACIÓN 2', 'REFRIGERACION', 2, 1.0, 4.0),
('CONGELACIÓN 1', 'CONGELACION', 1, -25.0, -18.0);

-- Insertar códigos QR predefinidos para fichado
INSERT INTO codigos_qr_locales (codigo, ubicacion, descripcion, radio_metros) VALUES
('QR_COCINA_ENTRADA', 'Entrada Principal de Cocina', 'QR ubicado en entrada principal de cocina', 100),
('QR_COCINA_SALIDA', 'Salida de Cocina', 'QR ubicado en salida de cocina', 100),
('QR_ALMACEN', 'Almacén de Alimentos', 'QR ubicado en almacén de alimentos', 100),
('QR_OFICINA', 'Oficina Administrativa', 'QR ubicado en oficina administrativa', 100),
('QR_COMEDOR', 'Comedor de Personal', 'QR ubicado en comedor del personal', 100);

-- =====================================================
-- VISTAS PARA REPORTES Y CONSULTAS FRECUENTES
-- =====================================================

-- Vista: Asistencia Diaria con Detalles
CREATE VIEW vista_asistencia_diaria AS
SELECT 
    a.id,
    a.fecha,
    u.nombre || ' ' || u.apellido as empleado,
    u.cargo,
    u.area,
    a.hora_entrada,
    a.hora_salida,
    a.horas_trabajadas,
    a.estado,
    t.nombre as turno,
    a.metodo_fichado,
    a.observaciones
FROM asistencia a
JOIN usuarios u ON a.usuario_id = u.id
LEFT JOIN turnos t ON a.turno_id = t.id
ORDER BY a.fecha DESC, a.hora_entrada DESC;

-- Vista: Recepciones del Mes (Frutas y Verduras)
CREATE VIEW vista_recepciones_frutas_verduras AS
SELECT 
    r.id,
    r.fecha,
    r.hora,
    r.nombre_proveedor as proveedor,
    r.nombre_producto as producto,
    r.peso_unidad_recibido || ' ' || r.unidad_medida as cantidad,
    r.estado_producto,
    r.conformidad_integridad_producto,
    r.uniforme_completo,
    r.transporte_adecuado,
    r.puntualidad,
    r.responsable_registro_nombre as responsable,
    r.responsable_supervision_nombre as supervisor,
    r.observaciones,
    r.accion_correctiva,
    r.producto_rechazado
FROM control_recepcion_mercaderia r
WHERE r.tipo_control = 'FRUTAS_VERDURAS'
ORDER BY r.fecha DESC, r.hora DESC;

-- Vista: Recepciones de Abarrotes
CREATE VIEW vista_recepciones_abarrotes AS
SELECT 
    r.id,
    r.fecha,
    r.hora,
    r.nombre_proveedor as proveedor,
    r.nombre_producto as producto,
    r.peso_unidad_recibido || ' ' || r.unidad_medida as cantidad,
    r.registro_sanitario_vigente,
    r.fecha_vencimiento_producto,
    r.evaluacion_vencimiento,
    r.conformidad_empaque_primario,
    r.uniforme_completo,
    r.transporte_adecuado,
    r.puntualidad,
    r.responsable_registro_nombre as responsable,
    r.responsable_supervision_nombre as supervisor,
    r.observaciones,
    r.accion_correctiva,
    r.producto_rechazado
FROM control_recepcion_mercaderia r
WHERE r.tipo_control = 'ABARROTES'
ORDER BY r.fecha DESC, r.hora DESC;

-- Vista: Control de Cocción
CREATE VIEW vista_control_coccion AS
SELECT 
    c.id,
    c.fecha,
    c.hora,
    c.producto_cocinar,
    CASE c.proceso_coccion
        WHEN 'H' THEN 'Horno'
        WHEN 'P' THEN 'Plancha'
        WHEN 'C' THEN 'Cocina'
    END as proceso,
    c.temperatura_coccion,
    c.tiempo_coccion_minutos,
    c.conformidad,
    c.accion_correctiva,
    c.responsable_nombre
FROM control_coccion c
ORDER BY c.fecha DESC, c.hora DESC;

-- Vista: Control de Temperatura de Cámaras
CREATE VIEW vista_temperatura_camaras AS
SELECT 
    t.fecha,
    c.nombre as camara,
    c.tipo,
    c.numero_camara,
    CASE c.tipo
        WHEN 'REFRIGERACION' THEN '1°C a 4°C'
        WHEN 'CONGELACION' THEN '< -18°C'
    END as rango_permitido,
    t.temperatura_manana,
    t.conformidad_manana,
    t.responsable_manana_nombre,
    t.temperatura_tarde,
    t.conformidad_tarde,
    t.responsable_tarde_nombre,
    t.acciones_correctivas,
    t.supervisor_nombre
FROM control_temperatura_camaras t
JOIN camaras_frigorificas c ON t.camara_id = c.id
ORDER BY t.fecha DESC, c.numero_camara;

-- Vista: Control de Lavado de Manos
CREATE VIEW vista_lavado_manos AS
SELECT 
    l.id,
    l.fecha,
    l.hora,
    l.area_estacion,
    l.turno,
    l.nombres_apellidos as empleado,
    l.procedimiento_correcto,
    l.accion_correctiva,
    l.supervisor_nombre
FROM control_lavado_manos l
ORDER BY l.fecha DESC, l.hora DESC;

-- Vista: Control de Lavado de Frutas y Verduras
CREATE VIEW vista_lavado_frutas AS
SELECT 
    l.id,
    l.fecha,
    l.hora,
    l.nombre_fruta_verdura,
    l.producto_quimico,
    l.concentracion_producto,
    l.lavado_agua_potable,
    l.desinfeccion_producto_quimico,
    l.concentracion_correcta,
    l.tiempo_desinfeccion_minutos,
    l.acciones_correctivas,
    l.supervisor_nombre
FROM control_lavado_desinfeccion_frutas l
ORDER BY l.fecha DESC, l.hora DESC;

-- Vista: Resumen de No Conformidades por Mes
CREATE VIEW vista_resumen_no_conformidades AS
SELECT 
    'RECEPCION_MERCADERIA' as tipo_control,
    strftime('%Y-%m', fecha) as mes_anio,
    COUNT(*) as total_registros,
    SUM(CASE WHEN uniforme_completo = 'NC' OR transporte_adecuado = 'NC' OR puntualidad = 'NC' THEN 1 ELSE 0 END) as no_conformidades,
    SUM(CASE WHEN producto_rechazado = 1 THEN 1 ELSE 0 END) as productos_rechazados
FROM control_recepcion_mercaderia
GROUP BY strftime('%Y-%m', fecha)
UNION ALL
SELECT 
    'COCCION' as tipo_control,
    strftime('%Y-%m', fecha) as mes_anio,
    COUNT(*) as total_registros,
    SUM(CASE WHEN conformidad = 'NC' THEN 1 ELSE 0 END) as no_conformidades,
    0 as productos_rechazados
FROM control_coccion
GROUP BY strftime('%Y-%m', fecha)
UNION ALL
SELECT 
    'TEMPERATURA_CAMARAS' as tipo_control,
    strftime('%Y-%m', fecha) as mes_anio,
    COUNT(*) as total_registros,
    SUM(CASE WHEN conformidad_manana = 'NC' OR conformidad_tarde = 'NC' THEN 1 ELSE 0 END) as no_conformidades,
    0 as productos_rechazados
FROM control_temperatura_camaras
GROUP BY strftime('%Y-%m', fecha)
UNION ALL
SELECT 
    'LAVADO_MANOS' as tipo_control,
    strftime('%Y-%m', fecha) as mes_anio,
    COUNT(*) as total_registros,
    SUM(CASE WHEN procedimiento_correcto = 'NC' THEN 1 ELSE 0 END) as no_conformidades,
    0 as productos_rechazados
FROM control_lavado_manos
GROUP BY strftime('%Y-%m', fecha)
ORDER BY mes_anio DESC, tipo_control;

-- =====================================================
-- TRIGGERS PARA AUDITORÍA AUTOMÁTICA
-- =====================================================

-- Trigger: Auditar inserción en control_recepcion_mercaderia
CREATE TRIGGER trigger_audit_recepcion_insert
AFTER INSERT ON control_recepcion_mercaderia
FOR EACH ROW
BEGIN
    INSERT INTO auditoria_logs (
        usuario_id,
        usuario_nombre,
        accion,
        tabla_afectada,
        registro_id,
        datos_nuevos
    ) VALUES (
        NEW.responsable_registro_id,
        NEW.responsable_registro_nombre,
        'INSERT',
        'control_recepcion_mercaderia',
        NEW.id,
        json_object(
            'tipo_control', NEW.tipo_control,
            'fecha', NEW.fecha,
            'proveedor', NEW.nombre_proveedor,
            'producto', NEW.nombre_producto
        )
    );
END;

-- Trigger: Auditar actualización en control_recepcion_mercaderia
CREATE TRIGGER trigger_audit_recepcion_update
AFTER UPDATE ON control_recepcion_mercaderia
FOR EACH ROW
BEGIN
    INSERT INTO auditoria_logs (
        usuario_id,
        accion,
        tabla_afectada,
        registro_id,
        datos_anteriores,
        datos_nuevos
    ) VALUES (
        NEW.responsable_supervision_id,
        'UPDATE',
        'control_recepcion_mercaderia',
        NEW.id,
        json_object('observaciones', OLD.observaciones, 'accion_correctiva', OLD.accion_correctiva),
        json_object('observaciones', NEW.observaciones, 'accion_correctiva', NEW.accion_correctiva)
    );
END;

-- Trigger: Auditar inserción en control_coccion
CREATE TRIGGER trigger_audit_coccion_insert
AFTER INSERT ON control_coccion
FOR EACH ROW
BEGIN
    INSERT INTO auditoria_logs (
        usuario_id,
        usuario_nombre,
        accion,
        tabla_afectada,
        registro_id,
        datos_nuevos
    ) VALUES (
        NEW.responsable_id,
        NEW.responsable_nombre,
        'INSERT',
        'control_coccion',
        NEW.id,
        json_object(
            'producto', NEW.producto_cocinar,
            'temperatura', NEW.temperatura_coccion,
            'conformidad', NEW.conformidad
        )
    );
END;

-- Trigger: Auditar inserción en control_temperatura_camaras
CREATE TRIGGER trigger_audit_temperatura_insert
AFTER INSERT ON control_temperatura_camaras
FOR EACH ROW
BEGIN
    INSERT INTO auditoria_logs (
        accion,
        tabla_afectada,
        registro_id,
        datos_nuevos
    ) VALUES (
        'INSERT',
        'control_temperatura_camaras',
        NEW.id,
        json_object(
            'fecha', NEW.fecha,
            'camara_id', NEW.camara_id,
            'temp_manana', NEW.temperatura_manana,
            'temp_tarde', NEW.temperatura_tarde
        )
    );
END;

-- Trigger: Auditar actualización en control_temperatura_camaras
CREATE TRIGGER trigger_audit_temperatura_update
AFTER UPDATE ON control_temperatura_camaras
FOR EACH ROW
BEGIN
    INSERT INTO auditoria_logs (
        usuario_id,
        accion,
        tabla_afectada,
        registro_id,
        datos_anteriores,
        datos_nuevos
    ) VALUES (
        NEW.supervisor_id,
        'UPDATE',
        'control_temperatura_camaras',
        NEW.id,
        json_object('acciones_correctivas', OLD.acciones_correctivas),
        json_object('acciones_correctivas', NEW.acciones_correctivas)
    );
END;

-- =====================================================
-- FUNCIONES AUXILIARES (implementar en backend)
-- =====================================================

/*
NOTA: Estas funciones deben implementarse en el backend Node.js
ya que SQLite no soporta funciones personalizadas complejas.

1. calcularConformidadCoccion(temperatura)
   - Retorna 'C' si temperatura > 80, 'NC' si no

2. calcularConformidadTemperaturaRefrigeracion(temperatura)
   - Retorna 'C' si 1 <= temperatura <= 4, 'NC' si no

3. calcularConformidadTemperaturaCongelacion(temperatura)
   - Retorna 'C' si temperatura < -18, 'NC' si no

4. calcularEvaluacionVencimiento(fecha_vencimiento, fecha_actual)
   - EXCELENTE: diferencia > 6 meses
   - REGULAR: diferencia entre 1-6 meses
   - PESIMO: diferencia < 1 mes

5. copiarNombreProveedor(proveedor_id)
   - Copia el nombre completo del proveedor para historial

6. copiarNombreProducto(producto_id)
   - Copia el nombre del producto para historial

7. copiarNombreUsuario(usuario_id)
   - Copia nombre y cargo del usuario para historial
*/

-- =====================================================
-- CONSULTAS ÚTILES PARA REPORTES
-- =====================================================

/*
-- Reporte: Productos rechazados en el mes
SELECT 
    fecha,
    nombre_proveedor,
    nombre_producto,
    accion_correctiva
FROM control_recepcion_mercaderia
WHERE producto_rechazado = 1
  AND strftime('%Y-%m', fecha) = '2024-03'
ORDER BY fecha DESC;

-- Reporte: Temperaturas fuera de rango esta semana
SELECT 
    fecha,
    c.nombre as camara,
    temperatura_manana,
    conformidad_manana,
    temperatura_tarde,
    conformidad_tarde,
    acciones_correctivas
FROM control_temperatura_camaras t
JOIN camaras_frigorificas c ON t.camara_id = c.id
WHERE (conformidad_manana = 'NC' OR conformidad_tarde = 'NC')
  AND fecha >= date('now', '-7 days')
ORDER BY fecha DESC;

-- Reporte: No conformidades de lavado de manos por empleado
SELECT 
    nombres_apellidos,
    COUNT(*) as total_registros,
    SUM(CASE WHEN procedimiento_correcto = 'NC' THEN 1 ELSE 0 END) as no_conformidades
FROM control_lavado_manos
WHERE strftime('%Y-%m', fecha) = '2024-03'
GROUP BY empleado_id, nombres_apellidos
HAVING no_conformidades > 0
ORDER BY no_conformidades DESC;

-- Reporte: Proveedores con más no conformidades
SELECT 
    nombre_proveedor,
    COUNT(*) as total_entregas,
    SUM(CASE WHEN uniforme_completo = 'NC' THEN 1 ELSE 0 END) as sin_uniforme,
    SUM(CASE WHEN transporte_adecuado = 'NC' THEN 1 ELSE 0 END) as transporte_inadecuado,
    SUM(CASE WHEN puntualidad = 'NC' THEN 1 ELSE 0 END) as impuntual,
    SUM(CASE WHEN producto_rechazado = 1 THEN 1 ELSE 0 END) as productos_rechazados
FROM control_recepcion_mercaderia
WHERE strftime('%Y', fecha) = '2024'
GROUP BY proveedor_id, nombre_proveedor
ORDER BY productos_rechazados DESC, sin_uniforme DESC;

-- Reporte: Productos con temperaturas inadecuadas de cocción
SELECT 
    fecha,
    producto_cocinar,
    proceso_coccion,
    temperatura_coccion,
    tiempo_coccion_minutos,
    accion_correctiva,
    responsable_nombre
FROM control_coccion
WHERE conformidad = 'NC'
  AND strftime('%Y-%m', fecha) = '2024-03'
ORDER BY fecha DESC;
*/

-- =====================================================
-- FIN DEL SCRIPT DE BASE DE DATOS
-- =====================================================