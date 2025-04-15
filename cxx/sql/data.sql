-- 初始化积分事件类型数据
INSERT INTO `point_action` (`action_code`, `action_name`, `points`, `description`) VALUES
(1, '每日签到', 0, '用户每日签到获得的积分'),
(2, '下载文件', 0, '用户下载文件消耗的积分');

-- 初始化连续签到奖励规则
INSERT INTO `sign_reward_rule` (`continuous_days`, `reward_points`, `description`) VALUES
(1, 100, '第1天签到奖励100积分'),
(2, 200, '连续签到2天奖励200积分'),
(3, 300, '连续签到3天奖励300积分'),
(4, 500, '连续签到4天奖励500积分'),
(5, 800, '连续签到5天奖励800积分'),
(6, 1500, '连续签到6天奖励1500积分'),
(7, 2000, '连续签到7天奖励2000积分');