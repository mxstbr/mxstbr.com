'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

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

  // Detect screen size and touch device
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768) // md breakpoint
    }
    
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }

    // Initial checks
    checkScreenSize()
    checkTouchDevice()

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize)
    
    return () => {
      window.removeEventListener('resize', checkScreenSize)
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
        height: window.innerHeight - 70 // Account for taskbar + safe area
      })))
    }
  }, [isSmallScreen])

  const apps: { name: string; href: string; icon: string }[] = [
    { name: 'Calendar', href: '/cal', icon: '/static/images/windows_98_icons/calendar-0.png' },
    { name: 'Finance', href: '/finance', icon: '/static/images/windows_98_icons/briefcase-0.png' },
    { name: 'Reminders', href: '/reminder', icon: '/static/images/windows_98_icons/address_book-0.png' },
    { name: 'Todos', href: '/todos', icon: '/static/images/windows_98_icons/cardfile-0.png' },
  ]

  const openWindow = (app: { name: string; href: string; icon: string }) => {
    // Check if window is already open
    const existingWindow = windows.find(w => w.app.name === app.name)
    if (existingWindow) {
      // Bring existing window to front
      bringWindowToFront(existingWindow.id)
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
        height: window.innerHeight - 70 // Account for taskbar height + safe area
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
  }

  // Drag functionality
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
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.windowId || isSmallScreen) return

    const newX = e.clientX - dragState.offsetX
    const newY = e.clientY - dragState.offsetY

    // Constrain to viewport
    const constrainedX = Math.max(0, Math.min(newX, window.innerWidth - 200))
    const constrainedY = Math.max(0, Math.min(newY, window.innerHeight - 100))

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

  return (
    <div
      className="fixed inset-0 z-[9999] mt-0"
      onClick={handleDesktopClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
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
          paddingBottom: `calc(6rem + env(safe-area-inset-bottom))` 
        }}
      >
        <ul className="flex gap-6 content-start flex-col w-24">
          {apps.map((app) => (
            <li 
              key={app.name} 
              className="flex flex-col items-center gap-2 select-none"
              style={{
                border: selectedApp === app.name ? '1px dashed #000000' : '1px dashed transparent',
                padding: isTouchDevice ? '8px' : '4px', // Larger touch target on touch devices
                minHeight: isTouchDevice ? '80px' : 'auto',
                minWidth: isTouchDevice ? '80px' : 'auto',
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
                    width: 48, 
                    height: 48, 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                >
                  <Image
                    src={app.icon}
                    alt={app.name}
                    width={32}
                    height={32}
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <span
                  className="text-center text-sm leading-tight"
                  style={{ color: '#ffffff' }}
                >
                  {app.name}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

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
                <button aria-label="Minimize"></button>
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
                  background: 'white'
                }}
                title={windowState.app.name}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Taskbar: single 98.css status bar for full grey background */}
      <div 
        className="fixed left-0 right-0 bottom-0" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          backgroundColor: '#c0c0c0',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <div
          className="status-bar"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4, 
            padding: 2, 
            paddingBottom: `calc(2px + env(safe-area-inset-bottom, 20px))`,
            justifyContent: 'flex-start',
            backgroundColor: '#c0c0c0',
            border: 'none'
          }}
        >
          <button className="default" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
            const isFocused = windowState.id === focusedWindow.id
            
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
                  // Apply pressed/selected style for focused window
                  ...(isFocused ? {
                    border: '1px solid #808080',
                    borderStyle: 'inset',
                    backgroundColor: '#c0c0c0',
                    boxShadow: 'inset 1px 1px 0px 0px #808080, inset -1px -1px 0px 0px #dfdfdf'
                  } : {})
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  bringWindowToFront(windowState.id)
                }}
              >
                <Image
                  src={windowState.app.icon}
                  alt={windowState.app.name}
                  width={16}
                  height={16}
                  style={{ imageRendering: 'pixelated' }}
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
      </div>
    </div>
  )
}


