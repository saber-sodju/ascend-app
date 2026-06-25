"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";

function AscendLogo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.9)} viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="27" cy="5" r="3.5" fill="#D4A63A" />
      <path d="M2 34 L14 13 L20 23 L27 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M27 5 L38 34" stroke="#D4A63A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(username, password);
      setAuth(res.data.user, res.data.access_token);
      toast.success("Добро пожаловать!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "hsl(218 30% 5%)" }}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[120px]" style={{ background: "rgba(212, 166, 58, 0.06)" }} />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full blur-[100px]" style={{ background: "rgba(212, 166, 58, 0.04)" }} />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        {/* Logo block */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-5">
            <AscendLogo size={64} />
          </div>
          <h1 className="text-4xl font-bold tracking-[0.25em] uppercase" style={{ color: "#FFFFFF" }}>
            ASCEND
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-px w-8" style={{ background: "#D4A63A" }} />
            <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#D4A63A" }}>
              Track. Improve. Ascend.
            </p>
            <div className="h-px w-8" style={{ background: "#D4A63A" }} />
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-2xl p-8 border" style={{ background: "hsl(218 22% 10%)", borderColor: "hsl(218 15% 18%)" }}>
          <h2 className="text-lg font-semibold mb-6 text-foreground">Вход в систему</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block tracking-wide uppercase">
                Логин
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none transition-all text-sm"
                style={{
                  background: "hsl(218 18% 15%)",
                  border: "1px solid hsl(218 15% 20%)",
                }}
                onFocus={e => (e.target.style.borderColor = "#D4A63A")}
                onBlur={e => (e.target.style.borderColor = "hsl(218 15% 20%)")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block tracking-wide uppercase">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none transition-all text-sm"
                  style={{
                    background: "hsl(218 18% 15%)",
                    border: "1px solid hsl(218 15% 20%)",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#D4A63A")}
                  onBlur={e => (e.target.style.borderColor = "hsl(218 15% 20%)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
              style={{
                background: "linear-gradient(135deg, #D4A63A, #B8891E)",
                color: "hsl(218 28% 8%)",
              }}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Входим...</>
              ) : (
                <span className="tracking-wider text-sm font-bold">ВОЙТИ</span>
              )}
            </button>
          </form>
        </div>

        {/* Credentials hint */}
        <div className="mt-4 p-3 rounded-xl text-center" style={{ background: "hsl(218 18% 9%)", border: "1px solid hsl(218 15% 15%)" }}>
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground/60">admin</span>
            <span className="mx-2 text-muted-foreground/40">/</span>
            <span className="text-foreground/60">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
