-- V009: Seed tool rooms for each city

INSERT INTO tool_room (city_id, code, name)
SELECT id, code, name || ' Tool Room'
FROM city;
