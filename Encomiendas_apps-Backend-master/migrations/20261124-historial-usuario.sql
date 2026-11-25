ALTER TABLE historial_encomienda ADD COLUMN usuario_id INT NULL, ADD CONSTRAINT fk_historial_usuario FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL;
