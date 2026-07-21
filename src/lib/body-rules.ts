// ============================================================
// body-rules —— 身心合一 · 动静兼修 模块规则引擎
// 定义练习类型 / 时长 / 部位序列 / 状态机
// ============================================================

/** 练习类型 */
export type BodyType = 'zhanzhuang' | 'zhengqi' | 'pingyuan' | 'liyuan';

/** 练习分类：静功 vs 动功 */
export type BodyCategory = 'stillness' | 'movement';

/** 页面状态机 */
export type SessionState = 'select' | 'exercising' | 'summary';

/** 练习定义 */
export interface BodyExercise {
  id: BodyType;
  name: string;
  category: BodyCategory;
  /** 推荐练习时长（秒） */
  duration: number;
  icon: string;
  description: string;
  /** 主题色（用于卡片高亮） */
  tone: string;
}

/** 动功部位 */
export interface BodyPart {
  name: string;
}

/** 一次练习记录 */
export interface BodyRecord {
  type: BodyType;
  category: BodyCategory;
  totalDuration: number; // 秒
  completedParts: number;
  startedAt: number;     // Date.now()
  endedAt: number;
}

// —— 4 个练习 ——
export const BODY_EXERCISES: Record<BodyType, BodyExercise> = {
  zhanzhuang: {
    id: 'zhanzhuang',
    name: '混元桩',
    category: 'stillness',
    duration: 300, // 5 分钟
    icon: '🌱',
    description: '静功 · 站桩。凝神静气，意守丹田。',
    tone: '#86efac',
  },
  zhengqi: {
    id: 'zhengqi',
    name: '真气运行法',
    category: 'stillness',
    duration: 300,
    icon: '🌬️',
    description: '静功 · 坐禅。调息引气，疏通经脉。',
    tone: '#7dd3fc',
  },
  pingyuan: {
    id: 'pingyuan',
    name: '易筋经·平圆',
    category: 'movement',
    duration: 96, // 6 部位 × 8 拍 × 2s
    icon: '🌀',
    description: '动功 · 手部平圆导引。',
    tone: '#c8b496',
  },
  liyuan: {
    id: 'liyuan',
    name: '易筋经·立圆',
    category: 'movement',
    duration: 96,
    icon: '🌀',
    description: '动功 · 腿法立圆导引。',
    tone: '#c8b496',
  },
};

// —— 动功部位顺序（6 个，每个 8 拍）——
export const MOVEMENT_PARTS: BodyPart[] = [
  { name: '头部微转' },
  { name: '左臂平圆' },
  { name: '右臂平圆' },
  { name: '双手抱圆' },
  { name: '身体转圆' },
  { name: '腿部缓圆' },
];

/** 动功每部位拍数 */
export const BEATS_PER_PART = 8;

/** 动功每拍间隔（毫秒） */
export const BEAT_INTERVAL_MS = 2000;

/** 静功呼吸光点一个完整呼吸周期（毫秒） */
export const BREATH_CYCLE_MS = 8000;

/** 根据 type 拿到练习定义 */
export function getExercise(type: BodyType): BodyExercise {
  return BODY_EXERCISES[type];
}

/** 4 个练习的展示列表（按 UI 顺序） */
export const EXERCISE_LIST: BodyExercise[] = [
  BODY_EXERCISES.zhanzhuang,
  BODY_EXERCISES.zhengqi,
  BODY_EXERCISES.pingyuan,
  BODY_EXERCISES.liyuan,
];

/** 格式化秒为 mm:ss */
export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
