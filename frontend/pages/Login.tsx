import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Github,
  Lock,
  Mail,
} from "lucide-react";
import { BrandLogo, BrandPanel } from "../components/auth/BrandPanel";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Spinner } from "../components/ui/spinner";
import { toast } from "../components/ui/toast";
import { api } from "../services/api";
import { User as UserType } from "../types";
import "./Login.css";

export default function Login({
  onLogin,
}: {
  onLogin: (user: UserType) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await api.login(username, password);
      toast.success(`Welcome, ${user.full_name}!`);
      onLogin(user);
    } catch {
      setError("Invalid username or password");
      toast.error("Invalid username or password");
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    setError("");
    toast.info("The demo is starting. The first visit may take up to a minute.");

    try {
      const user = await api.loginAsGuest();
      toast.success("Welcome to the DialyCore demo");
      onLogin(user);
    } catch {
      setError("The demo is temporarily unavailable. Please try again.");
      toast.error("Unable to start the demo");
      setGuestLoading(false);
    }
  };

  const controlsDisabled = loading || guestLoading;

  return (
    <div className="login-page">
      <BrandPanel />

      <main className="login-form-panel">
        <div className="login-mobile-brand">
          <BrandLogo compact />
        </div>

        <section className="login-card" aria-labelledby="login-heading">
          <header className="login-card-header">
            <h2 id="login-heading">Welcome back</h2>
            <p>Sign in to your DialyCore workspace.</p>
          </header>

          <form onSubmit={handleLogin} className="login-form" aria-busy={loading}>
            <div className="login-field-group">
              <Label htmlFor="username">Email</Label>
              <div className="login-input-wrap">
                <Mail aria-hidden="true" />
                <Input
                  id="username"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={controlsDisabled}
                  required
                />
              </div>
            </div>

            <div className="login-field-group">
              <Label htmlFor="password">Password</Label>
              <div className="login-input-wrap login-input-wrap--password">
                <Lock aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={controlsDisabled}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="login-password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  disabled={controlsDisabled}
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="login-error">
                <AlertCircle aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="login-primary-button" disabled={controlsDisabled}>
              {loading ? (
                <span className="login-button-status">
                  <Spinner size="sm" className="login-spinner" />
                  Signing in...
                </span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight aria-hidden="true" />
                </>
              )}
            </Button>
          </form>

          <div className="login-divider" aria-hidden="true">
            <span />
            <small>OR</small>
            <span />
          </div>

          <Button
            type="button"
            variant="outline"
            className="login-demo-button"
            onClick={handleGuestLogin}
            disabled={controlsDisabled}
            aria-busy={guestLoading}
          >
            {guestLoading ? (
              <span className="login-button-status">
                <Spinner size="sm" className="login-spinner" />
                Starting demo...
              </span>
            ) : (
              <>
                <Eye aria-hidden="true" />
                <span>Explore the Demo</span>
                <ArrowRight aria-hidden="true" />
              </>
            )}
          </Button>
          <p className="login-demo-note">
            No account required <span aria-hidden="true">•</span> Read-only demo
          </p>
        </section>

        <footer className="login-footer">
          <span>Open-source dialysis workflows</span>
          <a
            href="https://github.com/WalidAlsafadi/dialycore"
            target="_blank"
            rel="noreferrer"
          >
            <Github aria-hidden="true" />
            GitHub
          </a>
        </footer>
      </main>
    </div>
  );
}
