'use client'

import { useState } from 'react'

interface ConsentModalProps {
  onConfirm: () => void
  onCancel: () => void
}

export function ConsentModal({ onConfirm, onCancel }: ConsentModalProps) {
  const [agreed, setAgreed] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">⚠️ 重要提示</h2>
        <p className="text-gray-600 mb-4">
          本报告由 AI 基于传统文化理论生成，仅供娱乐参考，
          不构成任何专业建议或决策依据。
        </p>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="consent"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="consent" className="text-sm text-gray-600">
            我已阅读并同意《免责声明》
          </label>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            不同意，返回
          </button>
          <button
            onClick={onConfirm}
            disabled={!agreed}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            同意并继续
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConsentModal
