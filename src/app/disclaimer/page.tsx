export default function DisclaimerPage() {
  return (
    <div className="container mx-auto py-12 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">⚠️ 免责声明</h1>
      <div className="prose">
        <p>
          本网站所提供之全部内容（含 AI 问答、占卜测算、疗愈对话、文化解读等）
          仅供中华传统文化交流、文化传承与休闲娱乐参考之用，
          不构成任何医疗、心理、法律、财务、职业等专业建议，
          亦不能替代专业人士的诊断、咨询或治疗。
        </p>
        <p>
          本站对所呈现内容之准确性、完整性、可靠性、时效性及适用性
          不作任何明示或默示之保证；
          用户基于本站内容所作出之任何决策、判断或行为，
          均由用户本人自行承担全部责任与风险，
          本网站及其运营方、关联方、贡献者概不承担任何法律责任。
        </p>
        <p>
          继续使用即视为您已阅读并同意 <a href="/terms">《服务条款》</a> 与 <a href="/privacy">《隐私政策》</a>。
        </p>
      </div>
    </div>
  );
}
