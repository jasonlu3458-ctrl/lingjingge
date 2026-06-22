'use client';

import { useEffect, useMemo, useState } from 'react';

interface CalendarHeatmapProps {
  /** 自定义数据源（用于测试）；不传则 fetch /api/user/calendar */
  mockDates?: string[];
  className?: string;
}

interface FetchResp {
  success?: boolean;
  dates?: string[];
  user_id?: string;
  error?: string;
  mock?: boolean;
}

/** 单格颜色档位：0=无 / 1=1 天 / 2=2-5 天 / 3=6+ 天 */
function levelOf(dailyCount: number): 0 | 1 | 2 | 3 {
  if (dailyCount <= 0) return 0;
  if (dailyCount === 1) return 1;
  if (dailyCount <= 5) return 2;
  return 3;
}

const CELL_COLORS = [
  'bg-gray-100 border border-gray-200',
  'bg-green-100 border border-green-200',
  'bg-green-300 border border-green-400',
  'bg-green-600 border border-green-700',
];

/** yyyy-MM-dd → Date（本地时区） */
function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 计算「最近 N 周」从哪一天开始：
 *   1) 终点 = 今天
 *   2) 起点 = 终点 - (N-1) 周，再向后退到那个周日（让 grid 第一列是周日）
 */
function buildGridStart(today: Date, weeks: number): Date {
  const end = new Date(today);
  const start = new Date(today);
  start.setDate(today.getDate() - weeks * 7 + 1);
  // 对齐到周日
  start.setDate(start.getDate() - start.getDay());
  return start;
}

/** 连续打卡天数（从今天往回数，遇到断签就停） */
function getStreak(dates: Set<string>, today: Date): number {
  let streak = 0;
  const cur = new Date(today);
  // 允许"今天还没打卡但昨天有"也算 0 起步，从今天数
  while (true) {
    if (dates.has(toYmd(cur))) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else if (streak === 0 && toYmd(cur) === toYmd(today)) {
      // 今天没打卡，从昨天开始算
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

export default function CalendarHeatmap({ mockDates, className = '' }: CalendarHeatmapProps) {
  const [dates, setDates] = useState<string[] | null>(mockDates ?? null);
  const [loading, setLoading] = useState<boolean>(!mockDates);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (mockDates) {
      setDates(mockDates);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/user/calendar', { cache: 'no-store' });
        const data: FetchResp = await r.json();
        if (cancelled) return;
        if (data.error && data.success !== true) {
          setErr(data.error || `HTTP ${r.status}`);
          setDates([]);
        } else {
          setDates(data.dates || []);
        }
      } catch (e: any) {
        if (cancelled) return;
        setErr(e?.message || 'fetch error');
        setDates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mockDates]);

  // 数据：52 周 × 7 天
  const { cells, monthLabels, totalDays, maxStreak } = useMemo(() => {
    const today = new Date();
    const weeks = 52;
    const start = buildGridStart(today, weeks);

    const dateSet = new Set(dates || []);

    // 统计每天活跃次数（API 已去重，但仍按出现次数作为"当日活跃强度"——这里每个日期计 1 次）
    const dailyCount: Record<string, number> = {};
    (dates || []).forEach((d) => {
      dailyCount[d] = (dailyCount[d] || 0) + 1;
    });

    const out: Array<{ date: Date; ymd: string; level: 0 | 1 | 2 | 3; future: boolean }> = [];
    let lastMonth = -1;
    const monthMap: Record<number, string> = {};

    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(start);
        cellDate.setDate(start.getDate() + w * 7 + d);
        const ymd = toYmd(cellDate);
        const future = cellDate.getTime() > today.getTime();
        out.push({
          date: cellDate,
          ymd,
          level: future ? 0 : levelOf(dailyCount[ymd] || 0),
          future,
        });
      }
      // 每月 1 号落在哪一列 → 月份标签
      const colStart = new Date(start);
      colStart.setDate(start.getDate() + w * 7);
      if (colStart.getDate() <= 7) {
        const m = colStart.getMonth();
        if (m !== lastMonth) {
          monthMap[w] = MONTH_NAMES[m];
          lastMonth = m;
        }
      }
    }

    return {
      cells: out,
      monthLabels: monthMap,
      totalDays: (dates || []).length,
      maxStreak: getStreak(dateSet, today),
    };
  }, [dates]);

  if (loading) {
    return (
      <div
        className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm ${className}`}
      >
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="h-24 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm ${className}`}
    >
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
          <span>📅</span>
          <span>最近 365 天修行记录</span>
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-500">
            累计{' '}
            <span className="text-gray-800 font-bold">{totalDays}</span> 天
          </span>
          <span className="text-gray-500">
            连续{' '}
            <span className="text-green-600 font-bold">{maxStreak}</span> 天
          </span>
          <span className="inline-flex items-center gap-1 text-gray-400">
            <span className={`inline-block w-2.5 h-2.5 rounded-sm ${CELL_COLORS[0]}`} />
            <span className={`inline-block w-2.5 h-2.5 rounded-sm ${CELL_COLORS[1]}`} />
            <span className={`inline-block w-2.5 h-2.5 rounded-sm ${CELL_COLORS[2]}`} />
            <span className={`inline-block w-2.5 h-2.5 rounded-sm ${CELL_COLORS[3]}`} />
            <span className="ml-1">少→多</span>
          </span>
        </div>
      </div>

      {err && (
        <div className="text-xs text-amber-600 mb-2">⚠ {err}</div>
      )}

      {/* 热力图：移动端横向滚动，桌面完整显示 */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="min-w-[760px]">
          {/* 月份标签 */}
          <div className="grid grid-flow-col grid-cols-52 gap-[3px] mb-1 ml-6 text-[10px] text-gray-400 select-none">
            {Array.from({ length: 52 }).map((_, w) => (
              <div key={w} className="h-3 leading-3">
                {monthLabels[w] || ''}
              </div>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {/* 周几标签 */}
            <div className="flex flex-col gap-[3px] mr-1 text-[10px] text-gray-400 select-none">
              {WEEKDAY_NAMES.map((wd, i) => (
                <div
                  key={i}
                  className="h-[14px] leading-[14px] w-4 text-right"
                  style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* 网格：52 列 × 7 行 */}
            <div
              className="grid grid-flow-col gap-[3px] flex-1"
              style={{ gridTemplateColumns: 'repeat(52, minmax(0, 1fr))' }}
            >
              {Array.from({ length: 52 }).map((_, w) => (
                <div key={w} className="flex flex-col gap-[3px]">
                  {Array.from({ length: 7 }).map((__, d) => {
                    const cell = cells[w * 7 + d];
                    if (!cell) return <div key={d} className="aspect-square" />;
                    const cls = cell.future
                      ? 'bg-transparent border border-transparent'
                      : CELL_COLORS[cell.level];
                    return (
                      <div
                        key={d}
                        title={`${cell.ymd} · ${cell.future ? '未来' : cell.level === 0 ? '未打卡' : '已修行'}`}
                        className={`aspect-square rounded-[2px] ${cls} hover:ring-1 hover:ring-green-500 transition-shadow`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 移动端提示 */}
      <div className="text-[10px] text-gray-400 mt-2 md:hidden">
        ← 左右滑动查看更多 →
      </div>
    </div>
  );
}
