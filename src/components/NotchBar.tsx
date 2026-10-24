import React, { useState, useEffect, useRef } from 'react'
import {
  GitBranch,
  Radio,
  CheckSquare,
  Terminal,
  ChevronDown,
  ChevronUp,
  Music,
  Power,
  Activity,
  Layers,
  Zap,
  AlertTriangle,
  Bell,
  Plus,
  Check,
  Trash2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ExternalLink
} from 'lucide-react'

export type DynamicPillState = 'idle' | 'charging' | 'battery-low' | 'notification'

export interface NotificationData {
  id?: string
  appName?: string
  title: string
  body: string
}

export interface TaskItem {
  id: string
  title: string
  completed: boolean
  createdAt: number
}

export interface MediaInfo {
  title: string
  artist: string
  album?: string
  isPlaying: boolean
  duration: number
  position: number
  source?: string
}

export interface GitStatusResult {
  branch: string
  modified: number
  untracked: number
  staged: number
  lastCommit: string
  isRepo: boolean
  repoPath: string
}

export interface PortStatus {
  port: number
  serviceName: string
  isOpen: boolean
  url: string
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// Track hit-testing state to prevent IPC thrashing and flickering
let isMouseIgnored: boolean | null = null
function updateHitTesting(interactive: boolean) {
  const shouldIgnore = !interactive
  if (isMouseIgnored === shouldIgnore) return
  isMouseIgnored = shouldIgnore
  window.devnotch?.setIgnoreMouseEvents(shouldIgnore, { forward: true })
}

export const NotchBar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'dev' | 'media' | 'tasks' | 'ai'>('dev')
  const [pillState, setPillState] = useState<DynamicPillState>('idle')
  const [batteryLevel, setBatteryLevel] = useState<number>(100)
  const [, setIsCharging] = useState<boolean>(false)
  const [activeNotif, setActiveNotif] = useState<NotificationData | null>(null)
  const [timeStr, setTimeStr] = useState(() => {
    const now = new Date()
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  })

  // Task manager state
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('all')

  // Media Player state
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null)
  const [lyrics, setLyrics] = useState<string | null>(null)
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false)

  // Git Status HUD state
  const [gitStatus, setGitStatus] = useState<GitStatusResult>({
    branch: 'main',
    modified: 0,
    untracked: 0,
    staged: 0,
    lastCommit: '',
    isRepo: true,
    repoPath: '',
  })

  // Dev Ports state
  const [ports, setPorts] = useState<PortStatus[]>([])
  const [isScanningPorts, setIsScanningPorts] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const morphTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerMorph = (state: DynamicPillState, duration = 3500) => {
    if (morphTimeoutRef.current) clearTimeout(morphTimeoutRef.current)
    setPillState(state)
    morphTimeoutRef.current = setTimeout(() => {
      setPillState('idle')
    }, duration)
  }

  // Clock ticker for the pill
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => {
      clearInterval(timer)
    }
  }, [])

  // Initial hit-testing & task loading
  useEffect(() => {
    updateHitTesting(false)

    window.devnotch?.loadTasks?.().then((loadedTasks) => {
      if (Array.isArray(loadedTasks)) {
        setTasks(loadedTasks)
      }
    }).catch((err) => {
      console.warn('[Zenith] Could not load initial tasks:', err)
    })

    return () => {
      isMouseIgnored = null
      if (morphTimeoutRef.current) clearTimeout(morphTimeoutRef.current)
    }
  }, [])

  const handleMouseEnter = () => {
    updateHitTesting(true)
  }

  const handleMouseLeave = () => {
    updateHitTesting(false)
  }

  const handleClose = () => {
    setIsExpanded(false)
    window.devnotch?.expandWindow(false)
    updateHitTesting(false)
  }

  const toggleExpand = () => {
    setIsExpanded((prev) => {
      const nextState = !prev
      window.devnotch?.expandWindow(nextState)
      updateHitTesting(nextState)
      return nextState
    })
  }

  // Global toggle listener (from shortcut or test event)
  useEffect(() => {
    const cleanupShortcut = window.devnotch?.onToggleNotch?.(() => {
      toggleExpand()
    })
    const handleTestToggle = () => {
      toggleExpand()
    }
    window.addEventListener('zenith:test-toggle', handleTestToggle)

    return () => {
      cleanupShortcut?.()
      window.removeEventListener('zenith:test-toggle', handleTestToggle)
    }
  }, [])

  // Battery monitoring (Native Chromium Battery API + Test Simulation)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      // @ts-expect-error - Chromium native BatteryManager
      navigator.getBattery().then((battery: any) => {
        const level = Math.round(battery.level * 100)
        setBatteryLevel(level)
        setIsCharging(battery.charging)

        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging)
          if (battery.charging) {
            triggerMorph('charging', 3500)
          }
        })
        battery.addEventListener('levelchange', () => {
          const lvl = Math.round(battery.level * 100)
          setBatteryLevel(lvl)
          if (!battery.charging && lvl <= 20) {
            triggerMorph('battery-low', 4000)
          }
        })
      }).catch(() => {})
    }

    const handleSimulateBattery = (e: Event) => {
      const customEvent = e as CustomEvent<{ charging: boolean; level: number }>
      const { charging, level } = customEvent.detail || {}
      if (typeof level === 'number') setBatteryLevel(level)
      if (typeof charging === 'boolean') {
        setIsCharging(charging)
        if (charging) {
          triggerMorph('charging', 3500)
        } else if (level <= 20) {
          triggerMorph('battery-low', 4000)
        }
      }
    }
    window.addEventListener('zenith:simulate-battery', handleSimulateBattery)

    return () => {
      window.removeEventListener('zenith:simulate-battery', handleSimulateBattery)
    }
  }, [])

  // System Notifications (IPC & Test Simulation)
  useEffect(() => {
    const handleNotification = (notif: NotificationData) => {
      setActiveNotif(notif)
      triggerMorph('notification', 4000)
    }

    const cleanupNotif = window.devnotch?.onNotification?.(handleNotification)
    const handleSimulateNotif = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationData>
      handleNotification(customEvent.detail)
    }
    window.addEventListener('zenith:simulate-notification', handleSimulateNotif)

    return () => {
      cleanupNotif?.()
      window.removeEventListener('zenith:simulate-notification', handleSimulateNotif)
    }
  }, [])

  // Test event listener for programmatic task addition
  useEffect(() => {
    const handleTestAddTask = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string }>
      if (customEvent.detail?.title) {
        handleAddTask(customEvent.detail.title)
      }
    }
    window.addEventListener('zenith:test-add-task', handleTestAddTask)
    return () => {
      window.removeEventListener('zenith:test-add-task', handleTestAddTask)
    }
  }, [tasks])

  // Media Player Simulation & GSMTC Polling
  useEffect(() => {
    const handleSimulateMedia = (e: Event) => {
      const customEvent = e as CustomEvent<MediaInfo | null>
      setMediaInfo(customEvent.detail)
    }
    window.addEventListener('zenith:simulate-media', handleSimulateMedia)

    let timer: ReturnType<typeof setInterval> | null = null
    const checkMedia = () => {
      window.devnotch?.getMediaInfo?.().then((info) => {
        if (info && info.title) {
          setMediaInfo(info)
        }
      }).catch(() => {})
    }

    if (activeTab === 'media' && isExpanded) {
      checkMedia()
      timer = setInterval(checkMedia, 3000)
    }

    return () => {
      window.removeEventListener('zenith:simulate-media', handleSimulateMedia)
      if (timer) clearInterval(timer)
    }
  }, [activeTab, isExpanded])

  // Synchronized Lyrics auto-fetch via LRCLIB
  useEffect(() => {
    if (!mediaInfo?.title) {
      setLyrics(null)
      return
    }
    setIsLoadingLyrics(true)
    window.devnotch?.getLyrics?.(mediaInfo.title, mediaInfo.artist || '')
      .then((data) => {
        if (data?.plainLyrics) {
          setLyrics(data.plainLyrics)
        } else if (data?.syncedLyrics) {
          const cleaned = data.syncedLyrics.replace(/\[\d+:\d+\.\d+\]\s*/g, '')
          setLyrics(cleaned)
        } else {
          setLyrics('No lyrics found on LRCLIB for this track.')
        }
      })
      .catch(() => {
        setLyrics('Unable to load lyrics.')
      })
      .finally(() => {
        setIsLoadingLyrics(false)
      })
  }, [mediaInfo?.title, mediaInfo?.artist])

  const handleMediaControl = (action: 'play' | 'pause' | 'next' | 'prev') => {
    if (mediaInfo) {
      if (action === 'play') setMediaInfo({ ...mediaInfo, isPlaying: true })
      if (action === 'pause') setMediaInfo({ ...mediaInfo, isPlaying: false })
    }
    window.devnotch?.controlMedia?.(action)
  }

  // Git Status HUD polling
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    const refreshGit = () => {
      window.devnotch?.getGitStatus?.().then((res) => {
        if (res) setGitStatus(res)
      }).catch(() => {})
    }

    refreshGit()
    if (isExpanded && activeTab === 'dev') {
      timer = setInterval(refreshGit, 5000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isExpanded, activeTab])

  // Dev Ports Monitor polling
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    const scanPorts = () => {
      setIsScanningPorts(true)
      window.devnotch?.scanLocalPorts?.()
        .then((res) => {
          if (Array.isArray(res)) {
            setPorts(res)
          }
        })
        .catch(() => {})
        .finally(() => setIsScanningPorts(false))
    }

    scanPorts()
    if (isExpanded && activeTab === 'dev') {
      timer = setInterval(scanPorts, 4000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isExpanded, activeTab])

  // Handle Escape key and outside blur to smoothly collapse deck
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        handleClose()
      }
    }
    const handleBlur = () => {
      if (isExpanded) {
        handleClose()
      } else {
        updateHitTesting(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('blur', handleBlur)
    }
  }, [isExpanded])

  const handleQuit = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.devnotch?.closeApp()
  }

  // Task Operations
  const handleAddTask = (titleOrEvent?: React.FormEvent | React.MouseEvent | string) => {
    if (titleOrEvent && typeof titleOrEvent !== 'string' && 'preventDefault' in titleOrEvent) {
      titleOrEvent.preventDefault()
    }
    const targetTitle = typeof titleOrEvent === 'string' ? titleOrEvent : newTaskTitle
    const trimmed = targetTitle.trim()
    if (!trimmed) return
    const newTask: TaskItem = {
      id: Date.now().toString(),
      title: trimmed,
      completed: false,
      createdAt: Date.now(),
    }
    const updated = [newTask, ...tasks]
    setTasks(updated)
    setNewTaskTitle('')
    window.devnotch?.saveTasks?.(updated)
  }

  const handleToggleTask = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    )
    setTasks(updated)
    window.devnotch?.saveTasks?.(updated)
  }

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id)
    setTasks(updated)
    window.devnotch?.saveTasks?.(updated)
  }

  const handleClearCompleted = () => {
    const updated = tasks.filter((t) => !t.completed)
    setTasks(updated)
    window.devnotch?.saveTasks?.(updated)
  }

  // Dynamic pill sizing and border styles
  const getPillDimensions = () => {
    if (isExpanded) {
      return 'w-[540px] h-[420px] rounded-b-[24px] rounded-t-none px-6 py-4 cursor-default'
    }
    switch (pillState) {
      case 'charging':
        return 'w-[330px] h-[38px] rounded-b-[18px] rounded-t-none cursor-pointer border-emerald-500/30 shadow-[0_12px_28px_rgba(16,185,129,0.15)]'
      case 'battery-low':
        return 'w-[310px] h-[38px] rounded-b-[18px] rounded-t-none cursor-pointer border-amber-500/30 shadow-[0_12px_28px_rgba(245,158,11,0.15)]'
      case 'notification':
        return 'w-[360px] h-[42px] rounded-b-[20px] rounded-t-none cursor-pointer border-sky-500/30 shadow-[0_12px_28px_rgba(56,189,248,0.15)]'
      case 'idle':
      default:
        return 'w-[260px] h-[38px] rounded-b-[18px] rounded-t-none cursor-pointer hover:border-white/20'
    }
  }

  return (
    <div className="w-full flex justify-center items-start select-none pt-0">
      <div
        ref={containerRef}
        data-testid="notch-pill"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseEnter}
        onPointerEnter={handleMouseEnter}
        onPointerLeave={handleMouseLeave}
        onPointerMove={handleMouseEnter}
        className={`
          relative bg-[#090A0F] text-zinc-100 border border-t-0 border-white/10
          shadow-[0_20px_40px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)]
          transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          overflow-hidden flex flex-col items-center justify-start
          ${getPillDimensions()}
        `}
        onClick={!isExpanded ? toggleExpand : undefined}
      >
        {/* COLLAPSED PILL VIEW & DYNAMIC ISLAND MORPHS */}
        {!isExpanded ? (
          <>
            {pillState === 'charging' && (
              <div className="w-[330px] h-[38px] flex items-center justify-between pointer-events-auto shrink-0 px-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 tracking-tight">
                    Power Connected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-3 rounded-[3px] border border-emerald-500/40 p-0.5 flex items-center">
                    <div
                      className="h-full bg-emerald-400 rounded-xs transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(10, batteryLevel))}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-zinc-300 font-semibold">{batteryLevel}%</span>
                </div>
              </div>
            )}

            {pillState === 'battery-low' && (
              <div className="w-[310px] h-[38px] flex items-center justify-between pointer-events-auto shrink-0 px-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                  </span>
                  <span className="text-xs font-semibold text-amber-400 tracking-tight">
                    Battery Low
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-3 rounded-[3px] border border-amber-500/40 p-0.5 flex items-center">
                    <div
                      className="h-full bg-amber-400 rounded-xs transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, batteryLevel))}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-amber-300 font-semibold">{batteryLevel}%</span>
                </div>
              </div>
            )}

            {pillState === 'notification' && (
              <div className="w-[360px] h-[42px] flex items-center justify-between pointer-events-auto shrink-0 px-3.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                    <Bell className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-xs font-semibold text-zinc-200 truncate">
                      {activeNotif?.title || 'System Notification'}
                    </span>
                    <span className="text-[10px] text-zinc-400 truncate">
                      {activeNotif?.body || 'New alert received'}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 shrink-0 ml-2">
                  {activeNotif?.appName || 'System'}
                </span>
              </div>
            )}

            {pillState === 'idle' && (
              <div className="w-[260px] h-[38px] flex items-center justify-between pointer-events-auto shrink-0 px-4">
                {/* Left: Steady status dot & Clock */}
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                  <span className="text-[11px] font-medium text-zinc-300 font-mono tracking-tight">
                    {timeStr || 'ZENITH'}
                  </span>
                </div>

                {/* Center: Brand & Telemetry Indicator */}
                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-200 tracking-tight">Zenith</span>
                  <span className="text-zinc-600">//</span>
                  <span className="font-mono text-[10px] text-zinc-400">DEV</span>
                </div>

                {/* Right: Expand Trigger */}
                <div className="flex items-center text-zinc-500 hover:text-zinc-200 transition-colors">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            )}
          </>
        ) : (
          /* EXPANDED DECK VIEW (Engineered Anti-Slop Layout) */
          <div className="w-full h-full flex flex-col justify-between">
            {/* Top Bar: Navigation & Controls */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <nav className="flex items-center gap-1">
                {(
                  [
                    { id: 'dev', label: 'Dev', icon: Activity },
                    { id: 'media', label: 'Music', icon: Music },
                    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
                    { id: 'ai', label: 'AI', icon: Terminal },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === id
                        ? 'bg-white/10 text-white'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Collapse"
                  aria-label="Collapse"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={handleQuit}
                  className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-white/10 transition-colors"
                  title="Quit Application"
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 py-3 overflow-hidden">
              {activeTab === 'dev' && (
                <div className="h-full flex flex-col justify-between space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Git Status Card */}
                    <div className="p-3 bg-white/[0.02] border border-white/[0.08] rounded-xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <GitBranch className="w-3.5 h-3.5 text-sky-400" /> Git Status
                        </span>
                        {gitStatus.modified + gitStatus.untracked + gitStatus.staged === 0 ? (
                          <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> clean
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-amber-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> dirty
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div className="font-mono text-sm font-semibold text-zinc-100 truncate">
                          {gitStatus.branch || 'detached'}
                        </div>
                        {gitStatus.lastCommit && (
                          <span
                            className="text-[10px] text-zinc-500 font-mono truncate max-w-[130px]"
                            title={gitStatus.lastCommit}
                          >
                            {gitStatus.lastCommit}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-1 flex items-center justify-between">
                        <span>
                          {gitStatus.modified + gitStatus.untracked + gitStatus.staged === 0
                            ? '0 uncommitted files'
                            : `${gitStatus.modified + gitStatus.untracked + gitStatus.staged} uncommitted (${gitStatus.modified}M, ${gitStatus.untracked}?, ${gitStatus.staged}S)`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            window.devnotch?.getGitStatus?.().then((res) => {
                              if (res) setGitStatus(res)
                            })
                          }}
                          className="hover:text-zinc-300 transition-colors ml-1"
                          title="Refresh Git status"
                        >
                          ↻
                        </button>
                      </div>
                    </div>

                    {/* Port Monitor Card */}
                    <div className="p-3 bg-white/[0.02] border border-white/[0.08] rounded-xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Radio className="w-3.5 h-3.5 text-sky-400" /> Dev Ports
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono text-[10px] ${
                              ports.filter((p) => p.isOpen).length > 0 ? 'text-sky-400' : 'text-zinc-500'
                            }`}
                          >
                            {ports.filter((p) => p.isOpen).length} listening
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsScanningPorts(true)
                              window.devnotch?.scanLocalPorts?.()
                                .then((res) => {
                                  if (Array.isArray(res)) setPorts(res)
                                })
                                .finally(() => setIsScanningPorts(false))
                            }}
                            className={`hover:text-zinc-300 transition-colors text-zinc-500 ${
                              isScanningPorts ? 'animate-spin' : ''
                            }`}
                            title="Scan ports now"
                          >
                            ↻
                          </button>
                        </div>
                      </div>

                      {ports.filter((p) => p.isOpen).length > 0 ? (
                        <div className="space-y-1 my-0.5 max-h-[52px] overflow-y-auto">
                          {ports
                            .filter((p) => p.isOpen)
                            .map((p) => (
                              <button
                                key={p.port}
                                type="button"
                                onClick={() => window.devnotch?.openExternal(p.url)}
                                className="w-full flex items-center justify-between p-1 rounded bg-white/[0.03] hover:bg-white/[0.08] transition-colors group text-left"
                                title={`Open ${p.url} in browser`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                                  <span className="font-mono text-xs font-semibold text-emerald-400">
                                    :{p.port}
                                  </span>
                                  <span className="text-[11px] text-zinc-400 truncate">
                                    {p.serviceName}
                                  </span>
                                </div>
                                <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-zinc-200 transition-colors shrink-0" />
                              </button>
                            ))}
                        </div>
                      ) : (
                        <div className="flex flex-col justify-center my-0.5">
                          <div className="text-xs text-zinc-400 font-mono">
                            No active servers
                          </div>
                          <div className="text-[10px] text-zinc-600 font-mono mt-0.5">
                            Scanning :3000, :5173, :8000, :8080...
                          </div>
                        </div>
                      )}

                      <div className="text-[10px] text-zinc-500 font-mono mt-1 truncate">
                        {ports.filter((p) => p.isOpen).length > 0
                          ? 'Click port to open in browser'
                          : 'Start dev server in any project'}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Island Morph Previews */}
                  <div className="p-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-mono text-[11px] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Notch Morphs:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClose()
                          setTimeout(() => triggerMorph('charging', 3500), 250)
                        }}
                        className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-mono text-emerald-400 transition-colors"
                      >
                        ⚡ Power
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClose()
                          setTimeout(() => triggerMorph('battery-low', 4000), 250)
                        }}
                        className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-mono text-amber-400 transition-colors"
                      >
                        ⚠️ Low Batt
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClose()
                          setTimeout(() => {
                            setActiveNotif({ appName: 'Git', title: 'Commit Pushed', body: 'Milestone 2 landed' })
                            triggerMorph('notification', 4000)
                          }, 250)
                        }}
                        className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-mono text-sky-400 transition-colors"
                      >
                        🔔 Alert
                      </button>
                    </div>
                  </div>

                  {/* Operational Telemetry Banner */}
                  <div className="p-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Architecture: Living Notch v1.0.0</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-zinc-500">Shortcut: Ctrl+Shift+Space</span>
                      <span className="text-emerald-400">60 FPS</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="h-full flex flex-col justify-between">
                  {!mediaInfo || !mediaInfo.title ? (
                    <div className="h-full flex flex-col justify-between p-4 bg-white/[0.01] border border-white/[0.06] rounded-xl text-center">
                      <div className="flex flex-col items-center justify-center flex-1 py-4">
                        <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
                          <Music className="w-6 h-6 text-zinc-400" />
                        </div>
                        <div className="text-sm font-semibold text-zinc-200">No Media Playing</div>
                        <div className="text-xs text-zinc-500 max-w-xs mt-1">
                          Windows GSMTC is listening for Spotify, Chrome, or Edge playback sessions.
                        </div>
                      </div>
                      {/* Quick Demo Previews */}
                      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                        <span className="text-zinc-500 font-mono text-[11px]">Preview Demo Tracks:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setMediaInfo({
                                title: 'Yellow',
                                artist: 'Coldplay',
                                album: 'Parachutes',
                                isPlaying: true,
                                duration: 269,
                                position: 45,
                                source: 'Spotify.exe'
                              })
                            }}
                            className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-mono text-emerald-400 transition-colors"
                          >
                            ▶ Yellow (Coldplay)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMediaInfo({
                                title: 'Starboy',
                                artist: 'The Weeknd',
                                album: 'Starboy',
                                isPlaying: true,
                                duration: 230,
                                position: 60,
                                source: 'Chrome.exe'
                              })
                            }}
                            className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-mono text-sky-400 transition-colors"
                          >
                            ▶ Starboy
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-between p-3.5 bg-white/[0.01] border border-white/[0.06] rounded-xl">
                      {/* Player Header & Info */}
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <Music className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="flex flex-col text-left overflow-hidden">
                            <span className="text-xs font-semibold text-zinc-100 truncate">
                              {mediaInfo.title}
                            </span>
                            <span className="text-[11px] text-zinc-400 truncate">
                              {mediaInfo.artist || 'Unknown Artist'} {mediaInfo.album ? `• ${mediaInfo.album}` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400/80 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                            {mediaInfo.source?.replace('.exe', '') || 'Media'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setMediaInfo(null)}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono transition-colors"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Synchronized Lyrics Box */}
                      <div className="flex-1 my-2 overflow-y-auto max-h-[140px] p-2.5 rounded-lg bg-black/40 border border-white/[0.04] text-center">
                        {isLoadingLyrics ? (
                          <div className="h-full flex items-center justify-center text-xs text-zinc-500 font-mono">
                            Fetching synchronized lyrics from LRCLIB...
                          </div>
                        ) : lyrics ? (
                          <div className="space-y-1.5 text-xs font-mono text-zinc-300 select-text leading-relaxed">
                            {lyrics.split('\n').filter(Boolean).map((line, idx) => (
                              <p
                                key={idx}
                                className={idx === 0 || idx === 1 ? 'text-emerald-400 font-semibold' : 'text-zinc-400/80'}
                              >
                                {line}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-zinc-500 font-mono">
                            No lyrics available for this song.
                          </div>
                        )}
                      </div>

                      {/* Progress & Controls Bar */}
                      <div className="space-y-2 pt-1 border-t border-white/[0.06]">
                        {/* Progress bar */}
                        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                          <span>{formatTime(mediaInfo.position || 0)}</span>
                          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                              style={{
                                width: `${mediaInfo.duration ? Math.min(100, ((mediaInfo.position || 0) / mediaInfo.duration) * 100) : 35}%`,
                              }}
                            />
                          </div>
                          <span>{formatTime(mediaInfo.duration || 0)}</span>
                        </div>

                        {/* Playback Controls */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-zinc-500">LRCLIB Synced</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              data-testid="media-prev"
                              onClick={() => handleMediaControl('prev')}
                              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                              title="Previous Track"
                            >
                              <SkipBack className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              data-testid="media-play-pause"
                              onClick={() => handleMediaControl(mediaInfo.isPlaying ? 'pause' : 'play')}
                              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                              title={mediaInfo.isPlaying ? 'Pause' : 'Play'}
                            >
                              {mediaInfo.isPlaying ? (
                                <Pause className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                              ) : (
                                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400 ml-0.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              data-testid="media-next"
                              onClick={() => handleMediaControl('next')}
                              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                              title="Next Track"
                            >
                              <SkipForward className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">Win Media Key</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="h-full flex flex-col justify-between p-3.5 bg-white/[0.01] border border-white/[0.06] rounded-xl">
                  {/* Tasks Header Bar */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-semibold text-zinc-200 tracking-tight">
                        Daily Quick Tasks
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-zinc-400">
                        {tasks.filter((t) => t.completed).length}/{tasks.length} done
                      </span>
                      {tasks.some((t) => t.completed) && (
                        <button
                          type="button"
                          onClick={handleClearCompleted}
                          className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono transition-colors"
                        >
                          Clear Done
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Add Task Input Form */}
                  <form onSubmit={handleAddTask} className="flex items-center gap-2 my-2.5">
                    <input
                      type="text"
                      data-testid="new-task-input"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Add task and press Enter..."
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500/50"
                    />
                    <button
                      type="submit"
                      data-testid="add-task-btn"
                      onClick={(e) => {
                        e.preventDefault()
                        handleAddTask()
                      }}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-200 transition-colors"
                      title="Add task"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Scrollable Tasks List */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[175px]">
                    {tasks.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <span className="text-xs text-zinc-500 font-mono">
                          No tasks in queue. Type above to add one.
                        </span>
                      </div>
                    ) : (
                      tasks
                        .filter((t) => {
                          if (taskFilter === 'active') return !t.completed
                          if (taskFilter === 'completed') return t.completed
                          return true
                        })
                        .map((task) => (
                          <div
                            key={task.id}
                            data-testid={`task-item-${task.id}`}
                            className="group flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/10 transition-colors"
                          >
                            <button
                              type="button"
                              data-testid="task-toggle"
                              onClick={() => handleToggleTask(task.id)}
                              className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                            >
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  task.completed
                                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                    : 'border-white/20 hover:border-white/40'
                                }`}
                              >
                                {task.completed && <Check className="w-3 h-3 text-emerald-400" />}
                              </div>
                              <span
                                className={`text-xs truncate transition-colors ${
                                  task.completed ? 'line-through text-zinc-500' : 'text-zinc-200'
                                }`}
                              >
                                {task.title}
                              </span>
                            </button>
                            <button
                              type="button"
                              data-testid="task-delete"
                              onClick={() => handleDeleteTask(task.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-opacity"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                    )}
                  </div>

                  {/* Filter Status Bar */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      {(['all', 'active', 'completed'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setTaskFilter(f)}
                          className={`capitalize px-1.5 py-0.5 rounded transition-colors ${
                            taskFilter === f
                              ? 'bg-white/10 text-zinc-200'
                              : 'hover:text-zinc-300'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    <span>%APPDATA%/Zenith/tasks.json</span>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="h-full flex flex-col justify-between p-4 bg-white/[0.01] border border-white/[0.06] rounded-xl">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                      <span className="font-medium text-zinc-300">Quick AI Copilot</span>
                      <span className="font-mono text-[10px] text-zinc-500">Ollama & Gemini Bridge</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Paste stack trace or request code transformation..."
                      className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500/50"
                      readOnly
                    />
                  </div>
                  <div className="text-[11px] text-zinc-500 flex items-center justify-between font-mono pt-2 border-t border-white/[0.06]">
                    <span>Global Hotkey: Ctrl + Shift + Space</span>
                    <span className="text-zinc-400">Ready for Milestone 7</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Status Bar */}
            <footer className="pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-zinc-400">Zenith Active</span>
              </div>
              <span className="text-[10px] text-zinc-500">
                Press Esc or click outside to collapse
              </span>
            </footer>
          </div>
        )}
      </div>
    </div>
  )
}