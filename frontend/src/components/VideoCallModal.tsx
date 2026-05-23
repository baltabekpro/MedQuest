import { Video, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface Props {
  room: string
  onClose: () => void
}

export const VideoCallModal = ({ room, onClose }: Props) => {
  const jitsiUrl = `https://meet.jit.si/${room}`

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-green-600" />
            Видеоконсультация
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <iframe
          src={jitsiUrl}
          className="w-full border-0"
          style={{ height: '500px' }}
          allow="camera;microphone;fullscreen;display-capture"
          title="Видеоконсультация"
        />
      </DialogContent>
    </Dialog>
  )
}
