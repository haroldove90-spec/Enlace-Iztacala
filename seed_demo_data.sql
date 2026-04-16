-- ===============================================================
-- DATOS DE MUESTRA VECINALES PARA ENLACE IZTACALA
-- ===============================================================

-- 1. Insertar Perfiles de Vecinos (Simulando usuarios que ya existen en auth.users)
-- NOTA: Estos IDs son de ejemplo. En un entorno real, deben coincidir con auth.users
-- Para este demo, usaremos IDs generados.

INSERT INTO public.profiles (id, username, full_name, bio, address_verified)
VALUES 
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'dr_mendoza', 'Dr. Roberto Mendoza', 'Médico jubilado y vecino de Los Reyes desde hace 30 años. Apasionado por la seguridad comunitaria.', true),
  ('b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', 'elena_v', 'Maestra Elena Vázquez', 'Docente de primaria. Me encanta organizar eventos sociales para los niños de la colonia.', true),
  ('c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', 'artesano_pan', 'Panadería El Artesano', 'Pan artesanal hecho con amor en Iztacala. Ubicados frente al parque.', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Insertar Publicaciones (Posts)
INSERT INTO public.posts (user_id, content, category)
VALUES 
  (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 
    'Vecinos, les informo que el reporte de las luminarias fundidas en la Av. de los Reyes ya fue recibido. Personal municipal vendrá el miércoles a realizar el cambio. Por favor, mantengamos nuestras luces exteriores encendidas mientras tanto.', 
    'Seguridad'
  ),
  (
    'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', 
    '¡Buenos días, Iztacala! Hoy sacamos una tanda especial de conchas de chocolate amargo y naranja. Mencionen que son usuarios de Enlace Iztacala y llévense 4x3 en toda la panadería dulce.', 
    'Comercio'
  ),
  (
    'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', 
    '¿Quién se apunta para la jornada de limpieza del Parque Central este domingo? Empezaremos a las 9:00 AM. Traigan bolsas y guantes. ¡Hagamos que nuestra colonia brille!', 
    'Social'
  );

-- 3. Insertar Incidentes
INSERT INTO public.incidents (user_id, title, description, status, location)
VALUES 
  (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 
    'Fuga de Agua Potable', 
    'Hay una fuga considerable de agua potable brotando del pavimento. Se está desperdiciando mucha agua.', 
    'Reportado', 
    'Calle de los Monarcas #14, cerca de la Panadería'
  ),
  (
    'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', 
    'Recolección de Ramas tras Poda', 
    'Agradecemos al servicio de limpia. Ya pasaron por los desechos de la poda del camellón central.', 
    'Resuelto', 
    'Plaza Central e intersección con Av. Principal'
  );
