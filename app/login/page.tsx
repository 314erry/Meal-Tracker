"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Import auth store dynamically
      const { useAuthStore } = await import("@/lib/auth-store")

      // Use the auth store's login method
      await useAuthStore.getState().login(email, password)

      // The AuthWrapper will handle the redirection automatically
      console.log("Login completed, AuthWrapper should redirect")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Entrar</h1>
          <p className="auth-description">Entre na sua conta do Diário de Refeições</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <div className="input-with-icon">
              <Mail className="input-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input with-icon"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Senha
            </label>
            <div className="input-with-icon">
              <Lock className="input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input with-icon"
                placeholder="Sua senha"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                {showPassword ? <EyeOff className="icon-small" /> : <Eye className="icon-small" />}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="button button-primary full-width" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="icon-small animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Não tem uma conta?{" "}
            <Link href="/signup" legacyBehavior>
              <a className="auth-link">Criar conta</a>
            </Link>
          </p>
        </div>

        <div className="demo-info">
          <p className="demo-title">Conta de demonstração:</p>
          <p className="demo-credentials">Email: demo@example.com</p>
          <p className="demo-credentials">Senha: demo123</p>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #121212; /* fundo estilo Google Dark Mode */
          padding: 1rem;
        }

        .auth-card {
          background: #1e1e1e; /* card mais escuro, menos contraste */
          border-radius: 1rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          padding: 2.5rem;
          width: 100%;
          max-width: 400px;
          color: #e8eaed;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-title {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .auth-description {
          color: #9aa0a6;
          font-size: 0.875rem;
        }

        .form-label {
          font-weight: 500;
          color: #bdc1c6;
          margin-bottom: 0.25rem;
          display: inline-block;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 0.75rem;
          width: 1.25rem;
          height: 1.25rem;
          color: #5f6368;
          z-index: 1;
        }

        .form-input.with-icon {
          padding-left: 2.75rem;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          border: 1px solid #3c4043;
          font-size: 1rem;
          color: #e8eaed;
          background-color: #202124;
          transition: border 0.2s, background 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #10b981;
          background-color: #2c2c2c;
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #5f6368;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: color 0.2s;
        }

        .password-toggle:hover {
          color: #e8eaed;
        }

        .button {
          padding: 0.75rem 1rem;
          font-weight: 600;
          border-radius: 0.5rem;
          text-align: center;
          border: none;
          cursor: pointer;
          font-size: 1rem;
        }

        .button-primary {
          background-color: #10b981;
          color: white;
          transition: background 0.3s;
        }

        .button-primary:hover {
          background-color: #059669;
        }

        .full-width {
          width: 100%;
        }

        .error-message {
          background-color: #2c1c1c;
          border: 1px solid #f87171;
          color: #fecaca;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          text-align: center;
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #3c4043;
        }

        .auth-footer a.auth-link {
          color: #10b981 !important;
          text-decoration: none;
          font-weight: 500;
        }

        .auth-footer a.auth-link:hover {
          text-decoration: underline;
        }

        .demo-info {
          margin-top: 1.5rem;
          padding: 1rem;
          background-color: #202124;
          border-radius: 0.5rem;
          text-align: center;
        }

        .demo-title {
          font-weight: 600;
          color: #e8eaed;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .demo-credentials {
          font-size: 0.75rem;
          color: #9aa0a6;
          margin: 0.25rem 0;
          font-family: monospace;
        }

        .icon-small {
          width: 1.25rem;
          height: 1.25rem;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

    </div>
  )
}
