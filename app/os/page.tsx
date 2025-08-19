'use client'

import { useState } from 'react'
import Image from 'next/image'

export const dynamic = 'force-static'

export default function OsPage() {
  const [activeApp, setActiveApp] = useState<{ name: string; href: string; icon: string } | null>(null)
  const [selectedApp, setSelectedApp] = useState<string | null>(null)

  const apps: { name: string; href: string; icon: string }[] = [
    { name: 'Calendar', href: '/cal', icon: '/static/images/windows_98_icons/calendar-0.png' },
    { name: 'Finance', href: '/finance', icon: '/static/images/windows_98_icons/briefcase-0.png' },
    { name: 'Reminders', href: '/reminder', icon: '/static/images/windows_98_icons/address_book-0.png' },
    { name: 'Todos', href: '/todos', icon: '/static/images/windows_98_icons/cardfile-0.png' },
  ]

  const handleAppClick = (e: React.MouseEvent, app: { name: string; href: string; icon: string }) => {
    e.stopPropagation()
    if (selectedApp === app.name) {
      // Double click - open the app
      setActiveApp(app)
      setSelectedApp(null)
    } else {
      // Single click - select the app
      setSelectedApp(app.name)
    }
  }

  const handleAppDoubleClick = (e: React.MouseEvent, app: { name: string; href: string; icon: string }) => {
    e.stopPropagation()
    setActiveApp(app)
    setSelectedApp(null)
  }

  const closeModal = () => {
    setActiveApp(null)
  }

  const handleDesktopClick = () => {
    setSelectedApp(null)
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
      <div className="p-4 sm:p-6 pb-24 pl-6 sm:pl-8" onClick={(e) => e.stopPropagation()}>
        <ul className="flex flex-col gap-6 w-24 content-start">
          {apps.map((app) => (
            <li 
              key={app.name} 
              className="flex flex-col items-center gap-2 select-none"
              style={{
                border: selectedApp === app.name ? '1px dashed #ffffff' : '1px dashed transparent',
                padding: '4px',
                background: selectedApp === app.name ? 'rgba(255,255,255,0.1)' : 'transparent'
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

      {/* Modal */}
      {activeApp && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="window"
            style={{ 
              width: '80vw', 
              height: '80vh', 
              maxWidth: '1200px', 
              maxHeight: '800px',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="title-bar">
              <div className="title-bar-text">{activeApp.name}</div>
              <div className="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close" onClick={closeModal}></button>
              </div>
            </div>
            <div className="window-body" style={{ flex: 1, padding: 0 }}>
              <iframe
                src={activeApp.href}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: 'white'
                }}
                title={activeApp.name}
              />
            </div>
          </div>
        </div>
      )}

      {/* Taskbar: single 98.css status bar for full grey background */}
      <div 
        className="fixed left-0 right-0 bottom-0" 
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: '#c0c0c0' }}
      >
        <div
          className="status-bar"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4, 
            padding: 2, 
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
          <p
            className="status-bar-field"
            style={{ flex: 1, padding: '1px 6px', fontSize: 12, lineHeight: 1.2 }}
          >
            Ready
          </p>
          <p
            className="status-bar-field"
            style={{ padding: '1px 6px', fontSize: 12, lineHeight: 1.2 }}
          >
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  )
}


