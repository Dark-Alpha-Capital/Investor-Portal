-- Allow recommit after cancel/reject/expire: drop unique (deal, user).
-- Active-commitment uniqueness is enforced in application code.
DROP INDEX IF EXISTS `investment_deal_user_uniq`;
CREATE INDEX IF NOT EXISTS `investment_deal_user_idx` ON `investment` (`deal_id`, `user_id`);
