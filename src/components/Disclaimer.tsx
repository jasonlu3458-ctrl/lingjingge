import Link from 'next/link';

export interface DisclaimerProps {
  /** 顶部强调色，默认琥珀色 */
  accentClass?: string;
  /** 是否紧凑模式（用于嵌入卡片内），默认 false（页脚式全宽） */
  compact?: boolean;
}

/**
 * AI 工具页免责声明
 *
 * 优化点（相对原版）：
 * 1. 列举具体内容范围（AI 问答、占卜、疗愈、文化解读）—— 避免歧义
 * 2. 列举专业建议领域（医疗、心理、法律、财务、职业）—— 明确不替代专业人士
 * 3. 增加「明示或默示」表述 —— 堵住默认担保的法律漏洞
 * 4. 强调「用户本人自行承担」—— 责任归属清晰
 * 5. 增加「运营方、关联方、贡献者」连带责任声明 —— 扩大免责主体
 * 6. 配套友情链接至服务条款 + 隐私政策 —— 提升合规完整度
 */
export default function Disclaimer({
  accentClass = 'text-amber-200/80',
  compact = false,
}: DisclaimerProps) {
  return (
    <aside
      role="note"
      aria-label="免责声明"
      className={[
        'w-full',
        compact
          ? 'mt-6 p-4 rounded-lg border border-amber-200/30 bg-amber-50/40 text-xs text-amber-900/80'
          : 'mt-12 px-6 py-6 border-t border-amber-200/30 bg-[#f5f0eb]/60 backdrop-blur-sm',
      ].join(' ')}
    >
      <div className={compact ? '' : 'max-w-3xl mx-auto'}>
        <p
          className={[
            'font-semibold mb-2 tracking-wide',
            compact ? 'text-amber-900' : accentClass,
          ].join(' ')}
        >
          ⚠️ 免责声明
        </p>
        <p
          className={[
            'leading-relaxed',
            compact ? 'text-amber-900/80' : 'text-amber-100/70 text-sm',
          ].join(' ')}
          style={{ fontFamily: compact ? 'inherit' : "'Ma Shan Zheng', cursive, serif" }}
        >
          本网站所提供之全部内容（含 AI 问答、占卜测算、疗愈对话、文化解读等）仅供中华传统文化交流、文化传承与休闲娱乐参考之用，
          <strong>不构成任何医疗、心理、法律、财务、职业等专业建议</strong>，
          亦<strong>不能替代</strong>专业人士的诊断、咨询或治疗。
          本站对所呈现内容之<strong>准确性、完整性、可靠性、时效性及适用性不作任何明示或默示之保证</strong>；
          用户基于本站内容所作出之任何决策、判断或行为，均由<strong>用户本人自行承担全部责任与风险</strong>，
          本网站及其运营方、关联方、贡献者<strong>概不承担任何法律责任</strong>。
        </p>
        {!compact && (
          <p
            className="mt-3 text-xs text-amber-100/50"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            继续使用即视为您已阅读并同意{' '}
            <Link href="/tong/terms" className="underline hover:text-amber-100/80">
              《服务条款》
            </Link>{' '}
            与{' '}
            <Link href="/tong/privacy" className="underline hover:text-amber-100/80">
              《隐私政策》
            </Link>
            。
          </p>
        )}
      </div>
    </aside>
  );
}
