-- Run this in Hasura Console → Data → SQL
-- This will force track the reels table

INSERT INTO hdb_catalog.hdb_table 
(table_schema, table_name, configuration, is_enum) 
VALUES 
('public', 'reels', '{}', false)
ON CONFLICT (table_schema, table_name) DO NOTHING;