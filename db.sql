CREATE TABLE IF NOT EXISTS `projects` (
	`id` int(11) unsigned NOT NULL AUTO_INCREMENT,
	`title` varchar(64) NOT NULL DEFAULT '',
	`ip` varchar(16) NOT NULL,
	`created` datetime NOT NULL DEFAULT '0000-00-00 00:00',
    `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	KEY `ip` (`ip`),
	KEY `name` (`name`)
)  ENGINE=INNODB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE IF NOT EXISTS `seg` (
	`id` int(11) unsigned NOT NULL auto_increment,
	`project_id` int(11) unsigned NOT NULL,
	`group_id` int(11) unsigned NULL,
	`memo` varchar(140) NOT NULL DEFAULT '',
	`focus` boolean NOT NULL DEFAULT false,
	`created` datetime NULL,
	`completed` datetime NULL,
	PRIMARY KEY (id),
	FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=INNODB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;