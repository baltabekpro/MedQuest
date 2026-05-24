import { Brain, Loader2, RotateCcw, Sparkles, Stethoscope, User, FileText, ArrowRight, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useClassifier } from '@/hooks/useClassifier'
import { listUsers } from '@/api/users'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

export const ClassifierPage = () => {
  const [text, setText] = useState('')
  const { result, isLoading, error, classify, reset } = useClassifier()
  const navigate = useNavigate()

  const { data: usersData } = useQuery({
    queryKey: ['users', 'doctors'],
    queryFn: () => listUsers({ role: 'doctor', limit: 50 }),
  })

  const doctors = (usersData?.items ?? []).filter((u: any) => u.role === 'doctor')

  const matchingDoctors = result
    ? doctors.filter((d: any) => {
        const spec = (d.specialization || '').toLowerCase()
        const name = result.recommended_specialty_name.toLowerCase()
        return spec && (name.includes(spec) || spec.includes(name.split(' ')[0]))
      })
    : []

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
          <p className="text-sm text-muted">Введите жалобу пациента — ИИ определит нужного специалиста и рекомендует врача</p>
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
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={handleSubmit} disabled={isLoading || text.trim().length < 3}>
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Анализ...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Определить специалиста</>
            )}
          </Button>
          {result && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" /> Сбросить
            </Button>
          )}
        </div>
      </Card>

      {/* Quick examples */}
      {!result && !isLoading && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-text">Примеры жалоб</h3>
          <div className="flex flex-wrap gap-2">
            {[
              'Болит голова, головокружение',
              'Кашель и температура 38',
              'Боль в груди при дыхании',
              'Высыпания на коже, зуд',
              'Болит живот, тошнота',
              'Боль в суставах, отёк',
            ].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => { setText(example); classify(example) }}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:bg-slate-50 hover:text-text"
              >
                {example}
              </button>
            ))}
          </div>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          {/* Main recommendation */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-1" />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 shrink-0">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h2 className="text-xl font-bold text-text">
                      {result.recommended_specialty_name}
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-muted leading-relaxed">{result.reasoning}</p>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted">Уверенность ИИ</span>
                      <span className="font-semibold text-text">{confidencePercent}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${confidencePercent >= 70 ? 'bg-green-500' : confidencePercent >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${confidencePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Recommended doctors */}
          {matchingDoctors.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                <User className="h-4 w-4" /> Рекомендуемые врачи
              </h3>
              <div className="space-y-2">
                {matchingDoctors.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text">{doc.full_name}</p>
                        <p className="text-xs text-muted">{doc.specialization || doc.department || 'Врач'}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate(`/users/${doc.id}/profile`)}>
                      Профиль <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Alternative specialties */}
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

          {/* Action buttons */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-3">
              <Button className="gap-2" onClick={() => navigate('/requests')}>
                <FileText className="h-4 w-4" /> Создать заявку
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => navigate('/schedule')}>
                <Stethoscope className="h-4 w-4" /> Записать на приём
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
