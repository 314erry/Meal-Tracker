"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { User, LogOut, ChevronDown } from "lucide-react"

export function UserMenu() {
  const { user, logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    setIsOpen(false)
  }

  return (
    <div className="user-menu">
      <button className="user-menu-trigger" onClick={() => setIsOpen(!isOpen)}>
        <User className="icon-small" />
        <span>{user.name}</span>
        <ChevronDown className="icon-small" />
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-info">
            <p className="user-name">{user.name}</p>
            <p className="user-email">{user.email}</p>
          </div>
          <hr className="menu-divider" />
          <button className="menu-item" onClick={handleLogout}>
            <LogOut className="icon-small" />
            Sair
          </button>
        </div>
      )}

      <style jsx>{`
        .user-menu {
          position: relative;
        }

        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid var(--color-card-border);
          border-radius: var(--border-radius);
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .user-menu-trigger:hover {
          background-color: var(--color-background);
        }

        .user-menu-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          background: var(--color-card);
          border: 1px solid var(--color-card-border);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-lg);
          min-width: 200px;
          z-index: 50;
        }

        .user-info {
          padding: 1rem;
        }

        .user-name {
          font-weight: 600;
          margin: 0;
        }

        .user-email {
          font-size: 0.875rem;
          color: var(--color-muted);
          margin: 0.25rem 0 0 0;
        }

        .menu-divider {
          border: none;
          border-top: 1px solid var(--color-card-border);
          margin: 0;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .menu-item:hover {
          background-color: var(--color-background);
        }
      `}</style>
    </div>
  )
}
