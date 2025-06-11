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
          border: 1px solid #3c4043;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: background-color 0.2s;
          color: #e8eaed;
        }

        .user-menu-trigger:hover {
          background-color: #2c2c2c;
        }

        .user-menu-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          background: #1e1e1e;
          border: 1px solid #3c4043;
          border-radius: 0.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          min-width: 200px;
          z-index: 50;
          color: #e8eaed;
        }

        .user-info {
          padding: 1rem;
        }

        .user-name {
          font-weight: 600;
          margin: 0;
          color: #e8eaed;
        }

        .user-email {
          font-size: 0.875rem;
          color: #9aa0a6;
          margin: 0.25rem 0 0 0;
        }

        .menu-divider {
          border: none;
          border-top: 1px solid #3c4043;
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
          color: #e8eaed;
        }

        .menu-item:hover {
          background-color: #2c2c2c;
        }
      `}</style>
    </div>
  )
}
