SELECT query
FROM db_diamond.tbl_datasources
WHERE name = '{name}'
ORDER BY ts DESC
LIMIT 1