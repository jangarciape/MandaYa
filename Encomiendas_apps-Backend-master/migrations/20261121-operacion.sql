-- MySQL. Aplicar una vez en instalaciones con DB_SYNCHRONIZE desactivado.
ALTER TABLE pagos ADD COLUMN pagador_id INT NULL,
  ADD CONSTRAINT fk_pagos_pagador FOREIGN KEY (pagador_id) REFERENCES personas(id) ON DELETE RESTRICT;
ALTER TABLE traslados ADD COLUMN ultima_parada_id INT NULL,
  ADD COLUMN retorno_confirmado_at DATETIME NULL;
ALTER TABLE traslado_encomienda ADD COLUMN sede_descarga_id INT NULL;
