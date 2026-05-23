import { Shield, ShieldCheck, ShieldOff } from 'lucide-react'
import { useState } from 'react'
import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Props {
  isEnabled: boolean
  onStatusChange: () => void
}

export const TwoFactorSetup = ({ isEnabled, onStatusChange }: Props) => {
  const [showSetup, setShowSetup] = useState(false)
  const [showDisable, setShowDisable] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEnable = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/2fa/enable')
      setQrCode(data.qr_code_base64)
      setSecret(data.secret)
      setShowSetup(true)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setLoading(true)
    try {
      await api.post('/auth/2fa/verify', { code })
      toast.success('2FA активирована')
      setShowSetup(false)
      setCode('')
      onStatusChange()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Неверный код')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    setLoading(true)
    try {
      await api.post('/auth/2fa/disable', { code })
      toast.success('2FA отключена')
      setShowDisable(false)
      setCode('')
      onStatusChange()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Неверный код')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <ShieldCheck className="h-8 w-8 text-green-600" />
            ) : (
              <ShieldOff className="h-8 w-8 text-slate-400" />
            )}
            <div>
              <h3 className="font-semibold text-text">Двухфакторная аутентификация</h3>
              <p className="text-sm text-muted">
                {isEnabled ? 'Активна — ваш аккаунт защищён' : 'Отключена — рекомендуем включить'}
              </p>
            </div>
          </div>
          {isEnabled ? (
            <Button variant="outline" onClick={() => setShowDisable(true)}>
              Отключить
            </Button>
          ) : (
            <Button onClick={handleEnable} disabled={loading}>
              <Shield className="h-4 w-4" /> Включить
            </Button>
          )}
        </div>
      </Card>

      {/* Enable / Setup dialog */}
      <Dialog open={showSetup} onOpenChange={() => { setShowSetup(false); setCode('') }}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Настройка 2FA</DialogTitle>
          <p className="text-sm text-muted">
            Отсканируйте QR-код в Google Authenticator или введите секрет вручную.
          </p>
          {qrCode && (
            <div className="flex justify-center">
              <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="h-48 w-48" />
            </div>
          )}
          <div className="rounded-md bg-slate-50 p-2 text-center">
            <code className="text-xs tracking-widest text-text">{secret}</code>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Код из приложения</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="text-center text-lg tracking-[0.3em]"
            />
          </div>
          <Button onClick={handleVerify} disabled={code.length < 6 || loading} className="w-full">
            Подтвердить
          </Button>
        </DialogContent>
      </Dialog>

      {/* Disable dialog */}
      <Dialog open={showDisable} onOpenChange={() => { setShowDisable(false); setCode('') }}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Отключить 2FA</DialogTitle>
          <p className="text-sm text-muted">
            Введите код из приложения для подтверждения отключения.
          </p>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="text-center text-lg tracking-[0.3em]"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDisable(false)} className="flex-1">
              Отмена
            </Button>
            <Button onClick={handleDisable} disabled={code.length < 6 || loading} className="flex-1" variant="destructive">
              Отключить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
