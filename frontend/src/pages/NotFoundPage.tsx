import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/50'>
      {/* Decorative background */}
      <div className='absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl' />
      <div className='absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl' />
      <div className='absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-pink/5 blur-3xl' />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className='absolute rounded-full bg-primary/10'
          style={{
            width: 6 + Math.random() * 8,
            height: 6 + Math.random() * 8,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className='relative z-10 text-center'>
        {/* Animated 404 */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className='relative'
        >
          <h1 className='gradient-text text-[10rem] font-black leading-none tracking-tight'>404</h1>
          <motion.div
            className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <div className='h-48 w-48 rounded-full border-2 border-dashed border-primary/20' />
          </motion.div>
        </motion.div>

        <motion.h2
          className='mt-4 text-2xl font-bold text-slate-900'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Страница не найдена
        </motion.h2>

        <motion.p
          className='mx-auto mt-2 max-w-md text-muted'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Похоже, что страница, которую вы ищете, не существует или была перемещена.
        </motion.p>

        <motion.div
          className='mt-8 flex flex-wrap items-center justify-center gap-3'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button className='gap-2 shadow-lg shadow-primary/20' onClick={() => navigate('/dashboard')}>
              <Home className='h-4 w-4' />На главную
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button variant='outline' className='gap-2' onClick={() => navigate(-1)}>
              <ArrowLeft className='h-4 w-4' />Назад
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button variant='ghost' className='gap-2' onClick={() => navigate('/patients')}>
              <Search className='h-4 w-4' />Пациенты
            </Button>
          </motion.div>
        </motion.div>

        {/* Animated bouncing dots */}
        <div className='mt-12 flex items-center justify-center gap-2'>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className='h-2 w-2 rounded-full bg-primary/40'
              animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
