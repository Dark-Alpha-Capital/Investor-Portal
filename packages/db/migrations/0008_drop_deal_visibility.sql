-- MVP marketplace access is invite + live status; drop unused visibility field
ALTER TABLE `deal` DROP COLUMN `visibility`;
