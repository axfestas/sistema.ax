-- Add Kit Festa Completo item to the catalog (idempotent)
INSERT OR IGNORE INTO items (id, name, description, price, quantity) 
VALUES (1, 'Kit Festa Completo', 'Inclui mesas, cadeiras, toalhas e decoração', 350.00, 10);
