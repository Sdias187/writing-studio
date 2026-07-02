import { useState, type FormEvent } from "react"
import { useAuthStore } from "@/stores/auth-store"

type AuthMode = "login" | "register"

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  const { error, clearError, signIn, signUp, resetPassword } = useAuthStore()

  const displayError = localError ?? error

  // ── Validation ──

  const validate = (): boolean => {
    setLocalError(null)
    clearError()

    if (!email.trim()) {
      setLocalError("Informe seu email")
      return false
    }

    if (mode === "register") {
      if (!firstName.trim()) {
        setLocalError("Informe seu nome")
        return false
      }
      if (!lastName.trim()) {
        setLocalError("Informe seu sobrenome")
        return false
      }
    }

    if (password.length < 6) {
      setLocalError("A senha deve ter pelo menos 6 caracteres")
      return false
    }

    if (mode === "register" && password !== confirmPassword) {
      setLocalError("As senhas nao conferem")
      return false
    }

    return true
  }

  // ── Submit ──

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      if (mode === "login") {
        await signIn(email, password)
      } else {
        await signUp(email, password, firstName, lastName)
      }
    } catch {
      // error is set in the store
    } finally {
      setSubmitting(false)
    }
  }

  // ── Forgot password ──

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setLocalError("Informe seu email para recuperar a senha")
      return
    }

    setSubmitting(true)
    setLocalError(null)
    clearError()
    try {
      await resetPassword(email)
      setResetSent(true)
      setShowForgot(false)
    } catch {
      // error is set in the store
    } finally {
      setSubmitting(false)
    }
  }

  // ── Mode switch ──

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setLocalError(null)
    clearError()
    setResetSent(false)
    setShowForgot(false)
  }

  // ── Render ──

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-[22px] font-light tracking-[-0.011em] text-ink-primary">
            Azoth
          </h1>
          <p className="text-sm text-ink-secondary mt-2 tracking-[-0.011em]">
            Plataforma de Escrita Criativa
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-lg p-8">
          {/* Mode Toggle */}
          <div className="flex mb-8 border-b border-border">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 pb-3 text-sm font-medium tracking-[-0.011em] transition-colors ${
                mode === "login"
                  ? "text-ink-primary border-b-2 border-accent"
                  : "text-ink-secondary hover:text-ink-primary"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 pb-3 text-sm font-medium tracking-[-0.011em] transition-colors ${
                mode === "register"
                  ? "text-ink-primary border-b-2 border-accent"
                  : "text-ink-secondary hover:text-ink-primary"
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Reset sent confirmation */}
          {resetSent && (
            <div className="mb-6 p-3 rounded-lg bg-accent-subtle border border-accent/20">
              <p className="text-sm text-accent text-center tracking-[-0.011em]">
               Enviamos um link de recuperacao para seu email.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name fields (register only) */}
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-xs text-ink-secondary mb-1.5 tracking-[-0.011em]"
                  >
                    Nome
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Seu nome"
                    autoComplete="given-name"
                    className="w-full bg-surface border border-elevated rounded-lg px-3.5 py-2.5 text-sm text-ink-primary placeholder-ink-tertiary/50 outline-none transition-colors duration-150 focus:border-accent/50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-xs text-ink-secondary mb-1.5 tracking-[-0.011em]"
                  >
                    Sobrenome
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Seu sobrenome"
                    autoComplete="family-name"
                    className="w-full bg-surface border border-elevated rounded-lg px-3.5 py-2.5 text-sm text-ink-primary placeholder-ink-tertiary/50 outline-none transition-colors duration-150 focus:border-accent/50"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs text-ink-secondary mb-1.5 tracking-[-0.011em]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full bg-surface border border-elevated rounded-lg px-3.5 py-2.5 text-sm text-ink-primary placeholder-ink-tertiary/50 outline-none transition-colors duration-150 focus:border-accent/50"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs text-ink-secondary mb-1.5 tracking-[-0.011em]"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Minimo 6 caracteres" : "Sua senha"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full bg-surface border border-elevated rounded-lg px-3.5 py-2.5 text-sm text-ink-primary placeholder-ink-tertiary/50 outline-none transition-colors duration-150 focus:border-accent/50"
              />
              {/* Forgot password link (login only) */}
              {mode === "login" && !showForgot && (
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="block mt-1.5 text-xs text-ink-tertiary hover:text-accent transition-colors tracking-[-0.011em]"
                >
                  Esqueceu sua senha?
                </button>
              )}
            </div>

            {/* Confirm password (register only) */}
            {mode === "register" && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs text-ink-secondary mb-1.5 tracking-[-0.011em]"
                >
                  Confirmar senha
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  className="w-full bg-surface border border-elevated rounded-lg px-3.5 py-2.5 text-sm text-ink-primary placeholder-ink-tertiary/50 outline-none transition-colors duration-150 focus:border-accent/50"
                />
              </div>
            )}

            {/* Forgot password inline form */}
            {showForgot && mode === "login" && (
              <div className="p-3 rounded-lg bg-elevated/30 border border-border">
                <p className="text-xs text-ink-secondary mb-3 tracking-[-0.011em]">
                  Recebera um link de recuperacao no email informado.
                </p>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={submitting}
                  className="w-full bg-pure-white text-canvas text-sm font-semibold uppercase tracking-[-0.011em] rounded-lg px-5 py-2 transition-opacity duration-150 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? "Enviando..." : "Recuperar senha"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForgot(false); setLocalError(null); clearError() }}
                  className="block mx-auto mt-2 text-xs text-ink-tertiary hover:text-ink-secondary transition-colors tracking-[-0.011em]"
                >
                  Voltar
                </button>
              </div>
            )}

            {/* Error */}
            {displayError && (
              <p className="text-xs text-error tracking-[-0.011em]">
                {displayError}
              </p>
            )}

            {/* Submit (hidden during forgot flow) */}
            {!(showForgot && mode === "login") && (
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-pure-white text-canvas text-sm font-semibold uppercase tracking-[-0.011em] rounded-lg px-5 py-2.5 transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-3.5 h-3.5 border-2 border-canvas/30 border-t-canvas rounded-full animate-spin" />
                    {mode === "login" ? "Entrando..." : "Criando..."}
                  </span>
                ) : mode === "login" ? (
                  "Entrar"
                ) : (
                  "Criar Conta"
                )}
              </button>
            )}
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-ink-tertiary mt-6 tracking-[-0.011em]">
          {mode === "login"
            ? "Ainda nao tem conta? Clique em Cadastrar"
            : "Ja tem conta? Clique em Entrar"}
        </p>
      </div>
    </div>
  )
}
