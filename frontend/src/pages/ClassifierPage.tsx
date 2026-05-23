import { Brain, Loader2, RotateCcw, Sparkles, Stethoscope } from 'lucide-react'
import { useState } from 'react'
import { useClassifier } from '@/hooks/useClassifier'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

export const ClassifierPage = () => {
  const [text, setText] = useState('')
  const { result, isLoading, error, classify, reset } = useClassifier()

  const handleSubmit = () => {
    if (text.trim().length >= 3) {
      classify(text.trim())
    }
  }

  const handleReset = () => {
    setText('')
    reset()
  }

  const confidencePercent = result ? Math.round(result.confidence * 100) : 0

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">AI-Маршрутизатор</h1>
          <p className="text-sm text-muted">Введите жалобу пациента — система определит нужного специалиста</p>
        </div>
      </div>

      <Card className="p-6">
        <label className="mb-2 block text-sm font-medium text-text">Жалоба пациента</label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Например: Болит голова уже 3 дня, головокружение, тошнота по утрам..."
          rows={4}
          className="resize-none"
        />
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={isLoading || text.trim().length < 3}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Анализ...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Определить специалиста
              </>
            )}
          </Button>
          {result && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" /> Сбросить
            </Button>
          )}
        </div>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Stethoscope className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-text">
                  {result.recommended_specialty_name}
                </h2>
                <p className="mt-1 text-sm text-muted">{result.reasoning}</p>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted">Уверенность</span>
                    <span className="font-semibold text-text">{confidencePercent}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-700"
                      style={{ width: `${confidencePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {result.alternative_specialties.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-3 text-sm font-semibold text-text">Альтернативные специалисты</h3>
              <div className="space-y-3">
                {result.alternative_specialties.map((alt) => (
                  <div key={alt.specialty_id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <span className="text-sm font-medium text-text">{alt.specialty_name}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-400 transition-all duration-700"
                          style={{ width: `${Math.round(alt.confidence * 100)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs text-muted">
                        {Math.round(alt.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
