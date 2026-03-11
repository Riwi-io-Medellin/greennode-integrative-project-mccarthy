import bcrypt from "bcryptjs";

const hash = await bcrypt.hash("Admin1234", 10);
console.log(hash);

INSERT INTO Rol (id, name) VALUES
(1, 'admin'),
(2, 'empresa')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO user (email, password_hash, rol_id, empresa_id, is_admin)
VALUES ('admin@greennode.com', '$2b$10$PEGA_AQUI_EL_HASH', 1, NULL, 1);