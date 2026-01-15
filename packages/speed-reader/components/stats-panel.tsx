'use client'

import { X, BookOpen, Clock, Zap, Trophy } from 'lucide-react'
import type { ReadingStats } from './rsvp-reader'

interface StatsPanelProps {
  stats: ReadingStats
  onClose: () => void
  layout?: 'overlay' | 'page'
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}m ${secs}s`
}

export function StatsPanel({ stats, onClose, layout = 'overlay' }: StatsPanelProps) {
  const effectiveWpm =
    stats.totalTimeSeconds > 0 ? Math.round((stats.wordsRead / stats.totalTimeSeconds) * 60) : 0
  const isOverlay = layout === 'overlay'

  return (
    <div
      className={
        isOverlay
          ? 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'
          : 'flex-1 flex items-center justify-center px-6 py-8'
      }
    >
      <div className='bg-card border border-border rounded-xl shadow-xl w-full max-w-md'>
        <div className='flex items-center justify-between p-4 border-b border-border'>
          <h2 className='text-lg font-semibold'>Reading Statistics</h2>
          <button
            type='button'
            onClick={onClose}
            className='w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='p-4 grid grid-cols-2 gap-4'>
          <div className='bg-secondary/50 rounded-xl p-4'>
            <div className='flex items-center gap-2 text-muted-foreground mb-2'>
              <BookOpen className='w-4 h-4' />
              <span className='text-xs uppercase tracking-wide'>Words Read</span>
            </div>
            <p className='text-3xl font-bold'>{stats.wordsRead.toLocaleString()}</p>
          </div>

          <div className='bg-secondary/50 rounded-xl p-4'>
            <div className='flex items-center gap-2 text-muted-foreground mb-2'>
              <Clock className='w-4 h-4' />
              <span className='text-xs uppercase tracking-wide'>Time Spent</span>
            </div>
            <p className='text-3xl font-bold'>{formatTime(stats.totalTimeSeconds)}</p>
          </div>

          <div className='bg-secondary/50 rounded-xl p-4'>
            <div className='flex items-center gap-2 text-muted-foreground mb-2'>
              <Zap className='w-4 h-4' />
              <span className='text-xs uppercase tracking-wide'>Effective WPM</span>
            </div>
            <p className='text-3xl font-bold'>{effectiveWpm}</p>
          </div>

          <div className='bg-secondary/50 rounded-xl p-4'>
            <div className='flex items-center gap-2 text-muted-foreground mb-2'>
              <Trophy className='w-4 h-4' />
              <span className='text-xs uppercase tracking-wide'>Sessions</span>
            </div>
            <p className='text-3xl font-bold'>{stats.sessionsCompleted}</p>
          </div>
        </div>

        <div className='p-4 border-t border-border'>
          <div className='text-center text-sm text-muted-foreground'>
            {stats.wordsRead > 0 ? (
              <p>
                Great progress! You&apos;ve read {stats.wordsRead.toLocaleString()} words
                {stats.sessionsCompleted > 0 &&
                  ` across ${stats.sessionsCompleted} session${stats.sessionsCompleted > 1 ? 's' : ''}`}
                .
              </p>
            ) : (
              <p>Start reading to track your statistics!</p>
            )}
          </div>
        </div>

        <div className='p-4 border-t border-border'>
          <button
            type='button'
            onClick={onClose}
            className='w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
