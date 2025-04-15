-- 创建数据库
CREATE DATABASE IF NOT EXISTS file_bounty CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE file_bounty;

-- 创建用户表
DROP TABLE IF EXISTS `user`;
CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID，主键',
    `username` VARCHAR(50) NOT NULL COMMENT '用户名，唯一',
    `password` VARCHAR(128) NOT NULL COMMENT '密码，加密存储',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '用户状态：0-禁用，1-正常',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_username` (`username`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 用户资料表
DROP TABLE IF EXISTS `user_profile`;
CREATE TABLE IF NOT EXISTS `user_profile` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户资料ID，主键',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT '关联的用户ID',
    `email` VARCHAR(100) NOT NULL COMMENT '邮箱，唯一',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    `gender` TINYINT DEFAULT NULL COMMENT '性别：0-未知，1-男，2-女',
    `birth_date` DATE DEFAULT NULL COMMENT '出生日期',
    `bio` TEXT DEFAULT NULL COMMENT '个人简介',
    `website` VARCHAR(255) DEFAULT NULL COMMENT '个人网站',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_user_id` (`user_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户资料表';

-- 用户积分表
DROP TABLE IF EXISTS `user_points`;
CREATE TABLE IF NOT EXISTS `user_points` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    `points` INT NOT NULL DEFAULT 0 COMMENT '积分余额',
    `total_points` INT NOT NULL DEFAULT 0 COMMENT '累计获得积分',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户积分表';

-- 积分变动记录表
DROP TABLE IF EXISTS `points_record`;
CREATE TABLE IF NOT EXISTS `points_record` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    `points` INT NOT NULL COMMENT '变动积分数',
    `point_action_id` TINYINT UNSIGNED NOT NULL COMMENT '积分事件ID',
    `description` VARCHAR(255) NOT NULL COMMENT '变动描述',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_point_action_id` (`point_action_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分变动记录表';

-- 添加积分事件类型表
DROP TABLE IF EXISTS `point_action`;
CREATE TABLE IF NOT EXISTS `point_action` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `action_code` TINYINT NOT NULL COMMENT '事件代码，唯一',
    `action_name` VARCHAR(30) NOT NULL COMMENT '事件名称',
    `points` INT NOT NULL DEFAULT 0 COMMENT '默认积分值',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '事件描述',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_action_code` (`action_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分事件类型表';

-- 添加签到记录表（使用位图优化的辅助表）
DROP TABLE IF EXISTS `user_sign_record`;
CREATE TABLE IF NOT EXISTS `user_sign_record` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    `year` SMALLINT NOT NULL COMMENT '年份',
    `month` TINYINT NOT NULL COMMENT '月份',
    `sign_bitmap` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '签到位图(最多支持64位，够表示一个月)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_user_year_month` (`user_id`, `year`, `month`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_year_month` (`year`, `month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户每月签到记录表';

-- 周期签到记录表
DROP TABLE IF EXISTS `user_sign_cycle`;
CREATE TABLE IF NOT EXISTS `user_sign_cycle` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    `cycle_start_date` DATE NOT NULL COMMENT '周期开始日期',
    `cycle_length` TINYINT NOT NULL DEFAULT 7 COMMENT '周期长度（天数）',
    `current_sign_day` INT NOT NULL DEFAULT 1 COMMENT '当前周期已签到天数',
    `last_sign_date` DATE NOT NULL COMMENT '最后签到日期',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态(1进行中,0已结束)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_user_cycle` (`user_id`, `cycle_start_date`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status` (`status`),
    KEY `idx_last_sign_date` (`last_sign_date`),
    KEY `idx_cycle_start_date` (`cycle_start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户周期签到记录表';   

-- 连续签到奖励规则表
DROP TABLE IF EXISTS `sign_reward_rule`;
CREATE TABLE IF NOT EXISTS `sign_reward_rule` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `continuous_days` INT NOT NULL COMMENT '连续签到天数',
    `reward_points` INT NOT NULL COMMENT '奖励积分',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '规则描述',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_continuous_days` (`continuous_days`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='连续签到奖励规则表';

-- 文件信息表
DROP TABLE IF EXISTS `file_info`;
CREATE TABLE IF NOT EXISTS `file_info` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT UNSIGNED COMMENT '上传用户ID',
    `original_name` VARCHAR(255) NOT NULL COMMENT '原始文件名',
    `file_name` VARCHAR(255) NOT NULL COMMENT '存储的文件名',
    `file_path` VARCHAR(255) NOT NULL COMMENT '文件存储路径',
    `file_type` TINYINT NOT NULL COMMENT '文件类型/MIME类型',
    `file_size` BIGINT NOT NULL COMMENT '文件大小(字节)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件信息表';

-- 文件悬赏表
DROP TABLE IF EXISTS `file_bounty`;
CREATE TABLE IF NOT EXISTS `file_bounty` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT '发布用户ID',
    `title` VARCHAR(100) NOT NULL COMMENT '悬赏标题',
    `description` TEXT NOT NULL COMMENT '悬赏描述',
    `points` INT NOT NULL COMMENT '悬赏积分',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态(1:进行中,2:已完成,3:已关闭)',
    `view_count` INT DEFAULT 0 COMMENT '查看次数',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `end_at` DATETIME DEFAULT NULL COMMENT '结束时间',
    `winner_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '中标用户ID',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status` (`status`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件悬赏表';

-- 文件竞标表
DROP TABLE IF EXISTS `file_bid`;
CREATE TABLE IF NOT EXISTS `file_bid` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `bounty_id` BIGINT UNSIGNED NOT NULL COMMENT '关联的悬赏ID',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT '竞标用户ID',
    `file_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '上传的文件ID',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_bounty_id` (`bounty_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_file_id` (`file_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件竞标表';

-- 悬赏下载记录表
DROP TABLE IF EXISTS `bounty_download_record`;
CREATE TABLE IF NOT EXISTS `bounty_download_record` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `bounty_id` BIGINT UNSIGNED NOT NULL COMMENT '悬赏ID',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT '下载用户ID',
    `file_id` BIGINT UNSIGNED NOT NULL COMMENT '文件ID',
    `download_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '下载时间',
    PRIMARY KEY (`id`),
    KEY `idx_bounty_id` (`bounty_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_file_id` (`file_id`),
    KEY `idx_download_time` (`download_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='悬赏下载记录表';

-- 用户文件上传表(非悬赏相关的文件上传)
DROP TABLE IF EXISTS `user_upload_file`;
CREATE TABLE IF NOT EXISTS `user_upload_file` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT '上传用户ID',
    `file_id` BIGINT UNSIGNED NOT NULL COMMENT '文件ID',
    `title` VARCHAR(100) NOT NULL COMMENT '文件标题',
    `description` TEXT DEFAULT NULL COMMENT '文件描述',
    `download_count` INT DEFAULT 0 COMMENT '下载次数',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户文件上传表';

-- 用户文件下载记录表
DROP TABLE IF EXISTS `file_download_record`;
CREATE TABLE IF NOT EXISTS `file_download_record` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `file_id` BIGINT UNSIGNED NOT NULL COMMENT '文件ID',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT '下载用户ID',
    `download_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '下载时间',
    PRIMARY KEY (`id`),
    KEY `idx_file_id` (`file_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_download_time` (`download_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户文件下载记录表';

-- 系统消息表
DROP TABLE IF EXISTS `system_message`;
CREATE TABLE IF NOT EXISTS `system_message` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `title` VARCHAR(100) NOT NULL COMMENT '消息标题',
    `content` TEXT NOT NULL COMMENT '消息内容',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统消息表';

-- 用户会话表
DROP TABLE IF EXISTS `private_message_conversation`;
CREATE TABLE IF NOT EXISTS `private_message_conversation` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '会话ID',
    `conversation_id` VARCHAR(32) NOT NULL COMMENT '会话唯一标识',
    `initiator_id` BIGINT UNSIGNED NOT NULL COMMENT '会话发起人ID',
    `participant_id` BIGINT UNSIGNED NOT NULL COMMENT '会话参与人ID',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_conversation_id` (`conversation_id`),
    UNIQUE KEY `idx_users` (`initiator_id`, `participant_id`),
    KEY `idx_initiator_id` (`initiator_id`),
    KEY `idx_participant_id` (`participant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户会话表';

-- 私信表
DROP TABLE IF EXISTS `private_message`;
CREATE TABLE IF NOT EXISTS `private_message` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消息ID',
    `conversation_id` VARCHAR(32) NOT NULL COMMENT '关联的会话ID',
    `sender_id` BIGINT UNSIGNED NOT NULL COMMENT '发送者ID',
    `receiver_id` BIGINT UNSIGNED NOT NULL COMMENT '接收者ID',
    `content` TEXT NOT NULL COMMENT '消息内容',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_conversation_id` (`conversation_id`),
    KEY `idx_sender_id` (`sender_id`),
    KEY `idx_receiver_id` (`receiver_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='私信表';

-- 私信已读表
DROP TABLE IF EXISTS `private_message_read`;
CREATE TABLE IF NOT EXISTS `private_message_read` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    `conversation_id` VARCHAR(32) NOT NULL COMMENT '会话ID',
    `message_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '最后读取的消息ID',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_user_conversation` (`user_id`, `conversation_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_conversation_id` (`conversation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='私信已读表';

-- 系统消息已读表
DROP TABLE IF EXISTS `system_message_read`;
CREATE TABLE IF NOT EXISTS `system_message_read` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `message_id` BIGINT UNSIGNED NOT NULL COMMENT '消息ID',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_message_user` (`message_id`, `user_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统消息已读表';
