'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { setPasswordCookie, clearPasswordCookie } from './auth-actions'

export const dynamic = 'force-static'

interface WindowState {
  id: string
  app: { name: string; href: string; icon: string }
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  isMinimized: boolean
}

export default function OsPage() {
  const [windows, setWindows] = useState<WindowState[]>([])
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [nextZIndex, setNextZIndex] = useState(1000)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [safeAreaBottom, setSafeAreaBottom] = useState(0)
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginWindow, setShowLoginWindow] = useState(false)
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    windowId: string | null
    offsetX: number
    offsetY: number
  }>({
    isDragging: false,
    windowId: null,
    offsetX: 0,
    offsetY: 0
  })
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  // Check authentication status on mount
  useEffect(() => {
    fetch('/api/auth')
      .then((res) => res.text())
      .then((res) => {
        setIsAuthenticated(res === 'true')
      })
  }, [])

  // Detect screen size, touch device, and safe area
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768) // md breakpoint
    }
    
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }

    const checkSafeArea = () => {
      // Create a temporary element to read the safe area CSS variable
      const testElement = document.createElement('div')
      testElement.style.position = 'fixed'
      testElement.style.top = '0'
      testElement.style.left = '0'
      testElement.style.visibility = 'hidden'
      testElement.style.height = 'env(safe-area-inset-bottom)'
      document.body.appendChild(testElement)
      
      const computedHeight = window.getComputedStyle(testElement).height
      const safeAreaValue = parseInt(computedHeight, 10) || 0
      setSafeAreaBottom(safeAreaValue)
      
      document.body.removeChild(testElement)
    }

    // Initial checks
    checkScreenSize()
    checkTouchDevice()
    checkSafeArea()

    // Listen for resize and orientation change events
    window.addEventListener('resize', () => {
      checkScreenSize()
      checkSafeArea()
    })
    window.addEventListener('orientationchange', checkSafeArea)
    
    return () => {
      window.removeEventListener('resize', checkScreenSize)
      window.removeEventListener('orientationchange', checkSafeArea)
    }
  }, [])

  // Handle window resizing for responsive behavior
  useEffect(() => {
    if (isSmallScreen) {
      // Make all windows full screen when switching to small screen
      setWindows(prev => prev.map(w => ({
        ...w,
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight - (32 + safeAreaBottom) // Dynamic: taskbar height + actual safe area
      })))
    }
  }, [isSmallScreen, safeAreaBottom])

  const apps: { name: string; href: string; icon: string }[] = [
    { name: 'Calendar', href: '/cal', icon: '/static/images/windows_98_icons/calendar-0.png' },
    { name: 'Finance', href: '/finance', icon: '/static/images/windows_98_icons/briefcase-0.png' },
    { name: 'Reminders', href: '/reminder', icon: '/static/images/windows_98_icons/address_book-0.png' },
    { name: 'Todos', href: '/todos', icon: '/static/images/windows_98_icons/cardfile-0.png' },
    { name: 'Clippy', href: '/clippy', icon: '/static/images/windows_98_icons/clippy.webp' },
    { name: 'Blip', href: 'https://blip.mxstbr.com', icon: '/static/images/windows_98_icons/computer_taskmgr-0.png' },
  ]

  const openWindow = (app: { name: string; href: string; icon: string }) => {
    // Check if window is already open
    const existingWindow = windows.find(w => w.app.name === app.name)
    if (existingWindow) {
      // If window is minimized, restore it, otherwise bring to front
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id)
      } else {
        bringWindowToFront(existingWindow.id)
      }
      return
    }

    // Create new window with responsive sizing
    let windowConfig
    if (isSmallScreen) {
      // Full screen on small screens
      windowConfig = {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight - (32 + safeAreaBottom) // Dynamic: taskbar height + actual safe area
      }
    } else {
      // Windowed mode on larger screens
      const windowOffset = windows.length * 30
      windowConfig = {
        x: 100 + windowOffset,
        y: 100 + windowOffset,
        width: Math.min(1200, window.innerWidth * 0.8),
        height: Math.min(800, window.innerHeight * 0.8)
      }
    }

    const newWindow: WindowState = {
      id: `${app.name}-${Date.now()}`,
      app,
      ...windowConfig,
      zIndex: nextZIndex,
      isMinimized: false
    }

    setWindows(prev => [...prev, newWindow])
    setNextZIndex(prev => prev + 1)
  }

  const closeWindow = (windowId: string) => {
    setWindows(prev => prev.filter(w => w.id !== windowId))
  }

  const bringWindowToFront = (windowId: string) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId 
        ? { ...w, zIndex: nextZIndex }
        : w
    ))
    setNextZIndex(prev => prev + 1)
  }

  const minimizeWindow = (windowId: string) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId 
        ? { ...w, isMinimized: true }
        : w
    ))
  }

  const restoreWindow = (windowId: string) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId 
        ? { ...w, isMinimized: false, zIndex: nextZIndex }
        : w
    ))
    setNextZIndex(prev => prev + 1)
  }

  const handleAppClick = (e: React.MouseEvent, app: { name: string; href: string; icon: string }) => {
    e.stopPropagation()
    
    if (isTouchDevice) {
      // On touch devices, open app immediately on first click
      openWindow(app)
      setSelectedApp(null)
    } else {
      // On non-touch devices, use traditional double-click behavior
      if (selectedApp === app.name) {
        // Double click - open the app
        openWindow(app)
        setSelectedApp(null)
      } else {
        // Single click - select the app
        setSelectedApp(app.name)
      }
    }
  }

  const handleAppDoubleClick = (e: React.MouseEvent, app: { name: string; href: string; icon: string }) => {
    e.stopPropagation()
    openWindow(app)
    setSelectedApp(null)
  }

  const handleDesktopClick = () => {
    setSelectedApp(null)
    setIsStartMenuOpen(false)
  }

  const handleLogin = () => {
    startTransition(async () => {
      try {
        // Set the password cookie using server action
        await setPasswordCookie(loginPassword)
        
        // Check if authentication was successful
        const authCheck = await fetch('/api/auth')
        const isAuth = await authCheck.text()
        
        if (isAuth === 'true') {
          setIsAuthenticated(true)
          setShowLoginWindow(false)
          setLoginPassword('')
          setLoginError('')
        } else {
          setLoginError('Invalid password')
        }
      } catch (error) {
        setLoginError('Error logging in')
      }
    })
  }

  const handleLogout = () => {
    startTransition(async () => {
      try {
        // Clear the password cookie using server action
        await clearPasswordCookie()
        setIsAuthenticated(false)
        setIsStartMenuOpen(false)
      } catch (error) {
        console.error('Error logging out:', error)
      }
    })
  }

  const handleShutdown = () => {
    window.close()
  }

  // Drag functionality with document-level event listeners
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.windowId || isSmallScreen) return

    const newX = e.clientX - dragState.offsetX
    const newY = e.clientY - dragState.offsetY

    // Allow windows to be dragged outside on all sides while keeping some minimum visible area
    // Ensure at least 100px of the window remains visible from any edge
    const minVisibleSize = 100
    const constrainedX = Math.max(-window.innerWidth + minVisibleSize, Math.min(newX, window.innerWidth - minVisibleSize))
    const constrainedY = Math.max(-window.innerHeight + minVisibleSize, Math.min(newY, window.innerHeight - minVisibleSize))

    setWindows(prev => prev.map(w => 
      w.id === dragState.windowId 
        ? { ...w, x: constrainedX, y: constrainedY }
        : w
    ))
  }

  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      windowId: null,
      offsetX: 0,
      offsetY: 0
    })
    dragStartRef.current = null
  }

  // Attach document-level event listeners during drag
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      // Prevent text selection during drag
      document.body.style.userSelect = 'none'
      document.body.style.webkitUserSelect = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.userSelect = ''
        document.body.style.webkitUserSelect = ''
      }
    }
  }, [dragState.isDragging, dragState.windowId, dragState.offsetX, dragState.offsetY, isSmallScreen])

  const handleMouseDown = (e: React.MouseEvent, windowId: string) => {
    // Disable dragging on small screens
    if (isSmallScreen) {
      bringWindowToFront(windowId)
      return
    }

    const windowElement = e.currentTarget.closest('.window-container') as HTMLElement
    if (!windowElement) return

    const rect = windowElement.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    setDragState({
      isDragging: true,
      windowId,
      offsetX,
      offsetY
    })

    dragStartRef.current = { x: e.clientX, y: e.clientY }
    bringWindowToFront(windowId)
    
    // Prevent default to avoid any browser drag behavior
    e.preventDefault()
  }

  return (
    <div
      className="fixed inset-0 z-[9999] mt-0"
      onClick={handleDesktopClick}
      style={{
        backgroundColor: '#008080',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        color: 'black',
        marginTop: 0,
      }}
    >
      <link rel="stylesheet" href="https://unpkg.com/98.css" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      <div 
        className="p-4 sm:p-6 pl-6 sm:pl-8" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          paddingBottom: '4rem' // Fixed padding since safe area is now handled by taskbar
        }}
      >
        <ul className="flex gap-3 content-start flex-col w-32">
          {apps.map((app) => (
            <li 
              key={app.name} 
              className="flex flex-col items-center gap-2 select-none"
              style={{
                border: selectedApp === app.name ? '1px dashed #000000' : '1px dashed transparent',
                padding: isTouchDevice ? '8px' : '4px', // Larger touch target on touch devices
                minHeight: isTouchDevice ? '96px' : 'auto',
                minWidth: isTouchDevice ? '96px' : 'auto',
                justifyContent: 'center'
              }}
            >
              <div
                onClick={(e) => handleAppClick(e, app)}
                onDoubleClick={(e) => handleAppDoubleClick(e, app)}
                className="cursor-pointer"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '2px',
                  textDecoration: 'none'
                }}
              >
                <div
                  style={{ 
                    width: 64, 
                    height: 64, 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                >
                  <Image
                    src={app.icon}
                    alt={app.name}
                    width={48}
                    height={48}
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <span
                  className="text-center text-sm leading-tight"
                  style={{ 
                    color: '#ffffff',
                    fontFamily: '"MS Sans Serif", "Tahoma", sans-serif',
                    fontSize: '11px',
                    textShadow: '1px 1px 1px rgba(0,0,0,0.8)',
                    letterSpacing: '0px'
                  }}
                >
                  {app.name}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Login Window */}
      {showLoginWindow && (
        <div
          className="window-container fixed"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            maxWidth: '90vw',
            zIndex: 10000
          }}
        >
          <div className="window">
            <div className="title-bar">
              <div className="title-bar-text">Log On to Windows</div>
              <div className="title-bar-controls">
                <button 
                  aria-label="Close" 
                  onClick={() => {
                    setShowLoginWindow(false)
                    setLoginPassword('')
                    setLoginError('')
                  }}
                ></button>
              </div>
            </div>
            <div className="window-body" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <Image
                  src="/static/images/windows_98_icons/keys-0.png"
                  alt="Key"
                  width={32}
                  height={32}
                  style={{ imageRendering: 'pixelated', marginTop: 8 }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ marginBottom: 16 }}>Type a password to log on to Windows.</p>
                  <div className="field-row" style={{ marginBottom: 8 }}>
                    <label htmlFor="password" style={{ minWidth: 80 }}>Password:</label>
                    <input
                      id="password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isPending) {
                          handleLogin()
                        }
                      }}
                      style={{ flex: 1 }}
                      autoFocus
                      disabled={isPending}
                    />
                  </div>
                  {loginError && (
                    <p style={{ color: 'red', fontSize: 12, marginBottom: 8 }}>{loginError}</p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button onClick={handleLogin} disabled={isPending}>
                  {isPending ? 'Logging in...' : 'OK'}
                </button>
                <button onClick={() => {
                  setShowLoginWindow(false)
                  setLoginPassword('')
                  setLoginError('')
                }} disabled={isPending}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Menu */}
      {isStartMenuOpen && (
        <div
          className="window"
          style={{
            position: 'fixed',
            left: 0,
            bottom: 32 + safeAreaBottom,
            width: 220,
            zIndex: 9998,
            padding: 0,
            borderWidth: 2
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row',
            backgroundColor: '#c0c0c0',
            height: '100%'
          }}>
            <div style={{
              background: 'linear-gradient(180deg, #000080 0%, #1084d0 100%)',
              padding: '8px 4px',
              color: 'white',
              fontWeight: 'bold',
              fontSize: 14,
              display: 'flex',
              alignItems: 'flex-end',
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              width: 24
            }}>
              <div style={{ letterSpacing: 1 }}>
                <span style={{ fontWeight: 'bold' }}>MaxOS</span> <span style={{ fontWeight: 'normal' }}>98</span>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#c0c0c0' }}>
              {!isAuthenticated ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '2px 16px 2px 20px',
                    cursor: 'pointer',
                    fontSize: 11,
                    backgroundColor: 'transparent',
                    color: 'black',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#000080'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'black'
                  }}
                  onClick={() => {
                    setShowLoginWindow(true)
                    setIsStartMenuOpen(false)
                  }}
                >
                  <Image
                    src="/static/images/windows_98_icons/keys-0.png"
                    alt="Log On"
                    width={16}
                    height={16}
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <span>Log On...</span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '2px 16px 2px 20px',
                    cursor: 'pointer',
                    fontSize: 11,
                    backgroundColor: 'transparent',
                    color: 'black',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#000080'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'black'
                  }}
                  onClick={handleLogout}
                >
                  <Image
                    src="/static/images/windows_98_icons/keys-0.png"
                    alt="Log Off"
                    width={16}
                    height={16}
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <span>Log Off Max...</span>
                </div>
              )}
              <div style={{ 
                margin: '2px 4px',
                height: 2,
                borderTop: '1px solid #ffffff',
                borderBottom: '1px solid #808080',
              }} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '2px 16px 2px 20px',
                  cursor: 'pointer',
                  fontSize: 11,
                  backgroundColor: 'transparent',
                  color: 'black',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#000080'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'black'
                }}
                onClick={handleShutdown}
              >
                <Image
                  src="/static/images/windows_98_icons/shut_down_cool-0.png"
                  alt="Shut Down"
                  width={16}
                  height={16}
                  style={{ imageRendering: 'pixelated' }}
                />
                <span>Shut Down...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Windows */}
      {windows.map((windowState) => (
        <div
          key={windowState.id}
          className="window-container fixed"
          style={{
            left: windowState.x,
            top: windowState.y,
            width: windowState.width,
            height: windowState.height,
            zIndex: windowState.zIndex,
            display: windowState.isMinimized ? 'none' : 'block'
          }}
          onClick={() => bringWindowToFront(windowState.id)}
        >
          <div
            className="window"
            style={{ 
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div 
              className="title-bar"
              onMouseDown={(e) => handleMouseDown(e, windowState.id)}
              style={{ 
                cursor: isSmallScreen ? 'default' : 
                  (dragState.isDragging && dragState.windowId === windowState.id ? 'grabbing' : 'grab')
              }}
            >
              <div className="title-bar-text">{windowState.app.name}</div>
              <div className="title-bar-controls">
                <button 
                  aria-label="Minimize"
                  onClick={(e) => {
                    e.stopPropagation()
                    minimizeWindow(windowState.id)
                  }}
                ></button>
                <button aria-label="Maximize"></button>
                <button 
                  aria-label="Close" 
                  onClick={(e) => {
                    e.stopPropagation()
                    closeWindow(windowState.id)
                  }}
                ></button>
              </div>
            </div>
            <div className="window-body" style={{ flex: 1, padding: 0 }}>
              <iframe
                src={`${windowState.app.href}?os=true`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: 'white',
                  pointerEvents: dragState.isDragging ? 'none' : 'auto'
                }}
                title={windowState.app.name}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Taskbar with proper safe area handling */}
      <div 
        className="fixed left-0 right-0 bottom-0" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          backgroundColor: '#c0c0c0',
        }}
      >
        {/* Actual taskbar - stays at consistent height */}
        <div
          className="status-bar"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4, 
            padding: 2, 
            justifyContent: 'flex-start',
            backgroundColor: '#c0c0c0',
            border: 'none',
            minHeight: '28px' // Ensure consistent taskbar height
          }}
        >
          <button 
            className={isStartMenuOpen ? "" : "default"} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4,
              ...(isStartMenuOpen ? {
                border: '1px solid #808080',
                borderStyle: 'inset',
                backgroundColor: '#c0c0c0',
                boxShadow: 'inset 1px 1px 0px 0px #808080, inset -1px -1px 0px 0px #dfdfdf'
              } : {})
            }}
            onClick={(e) => {
              e.stopPropagation()
              setIsStartMenuOpen(!isStartMenuOpen)
            }}
          >
            <Image
              src="/static/images/windows_98_icons/windows_slanted-1.png"
              alt="Windows"
              width={16}
              height={16}
              style={{ imageRendering: 'pixelated' }}
            />
            Start
          </button>
          
          {/* Open windows in taskbar */}
          {windows.map((windowState) => {
            // Find the window with the highest zIndex (focused window)
            const focusedWindow = windows.reduce((prev, current) => 
              (current.zIndex > prev.zIndex) ? current : prev
            )
            const isFocused = windowState.id === focusedWindow.id && !windowState.isMinimized
            
            return (
              <button
                key={windowState.id}
                className={isFocused ? "" : "default"}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 4,
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  // Apply different styles based on window state
                  ...(windowState.isMinimized ? {
                    // Minimized window style - grayed out
                    backgroundColor: '#e0e0e0',
                    color: '#808080',
                    border: '1px solid #808080',
                    borderStyle: 'outset'
                  } : isFocused ? {
                    // Focused window style - pressed/selected
                    border: '1px solid #808080',
                    borderStyle: 'inset',
                    backgroundColor: '#c0c0c0',
                    boxShadow: 'inset 1px 1px 0px 0px #808080, inset -1px -1px 0px 0px #dfdfdf'
                  } : {})
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (windowState.isMinimized) {
                    restoreWindow(windowState.id)
                  } else {
                    bringWindowToFront(windowState.id)
                  }
                }}
              >
                <Image
                  src={windowState.app.icon}
                  alt={windowState.app.name}
                  width={16}
                  height={16}
                  style={{ 
                    imageRendering: 'pixelated',
                    opacity: windowState.isMinimized ? 0.6 : 1
                  }}
                />
                {windowState.app.name}
              </button>
            )
          })}
          
          <div style={{ flex: 1 }} />
          <p
            className="status-bar-field"
            style={{ padding: '1px 6px', fontSize: 12, lineHeight: 1.2, flexGrow: 0 }}
          >
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        
        {/* Grey safe area padding for mobile - only appears when safe area exists */}
        <div 
          style={{ 
            backgroundColor: '#c0c0c0',
            height: 'env(safe-area-inset-bottom)',
            minHeight: '0px' // Collapse to nothing when no safe area
          }}
        />
      </div>
    </div>
  )
}


