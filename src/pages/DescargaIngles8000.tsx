import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Download, ShieldAlert, FileText, KeyRound, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const ACCESS_KEY = "8000A";
const MAX_ATTEMPTS = 5;
const WHATSAPP_URL = "https://wa.me/12512724704";

// Enlaces de Google Drive (actualiza estas URLs cuando tengas los enlaces finales)
const FILE_MAIN_URL = "https://drive.google.com/file/d/1OpOLhD1QflcCqk9oay9IxpasgzMfV9-Z/view?usp=sharing";
const FILE_MAIN_NAME = "8.000 Palabras en Inglés con Pronunciación en Español · Fonética UK/USA";

const BONO_URL = "";
const BONO_NAME = "";

const DescargaIngles8000 = () => {
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("ingles8000_unlocked");
    if (stored === "yes") setUnlocked(true);
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (blocked) return;
    if (key.trim() === ACCESS_KEY) {
      setUnlocked(true);
      setError("");
      sessionStorage.setItem("ingles8000_unlocked", "yes");
    } else {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        setBlocked(true);
        setError("Demasiados intentos. Recarga la página o contáctanos por WhatsApp.");
      } else {
        setError(`Clave incorrecta. Intentos restantes: ${MAX_ATTEMPTS - next}`);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Descarga · 8.000 Palabras en Inglés con Pronunciación | ILINGUE RELAX"
        description="Área privada de descarga para compradores de 8.000 Palabras en Inglés con Pronunciación en Español."
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-10 md:py-16 max-w-3xl">
        {!unlocked ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border bg-card p-6 md:p-10 shadow-sm"
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-balance">
                Área privada de descarga
              </h1>
              <p className="text-muted-foreground mt-2 text-pretty">
                Ingresa la clave que recibiste en tu correo de compra para acceder a
                8.000 Palabras en Inglés con Pronunciación.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <Label htmlFor="key" className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" /> Clave de acceso
                </Label>
                <Input
                  id="key"
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Ingresa tu clave"
                  className="mt-2"
                  autoComplete="off"
                  disabled={blocked}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={blocked}>
                Desbloquear descarga
              </Button>
            </form>

            <div className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Aviso importante</p>
                  <p className="mt-1 text-pretty">
                    No compartas la clave con nadie. Si ya pagaste por PayPal, Stripe,
                    Yape o Plin, escríbeme por WhatsApp y envíame el comprobante para
                    validar tu acceso.
                  </p>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 px-3 py-2 rounded-md bg-accent text-accent-foreground font-semibold hover:opacity-90 transition"
                  >
                    <MessageCircle className="w-4 h-4" /> Escribir por WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-balance">
                ¡Descarga desbloqueada! 🎉
              </h1>
              <p className="text-muted-foreground mt-2 text-pretty">
                Abre los enlaces de Google Drive y descarga los archivos a tu dispositivo.
                Son de uso personal.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-xl border bg-card p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-pretty">{FILE_MAIN_NAME}</p>
                  <p className="text-xs text-muted-foreground">Producto principal · Google Drive</p>
                </div>
                <Button asChild className="w-full md:w-auto whitespace-normal h-auto py-2">
                  <a href={FILE_MAIN_URL} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" /> Abrir en Drive
                  </a>
                </Button>
              </div>

              <div className="rounded-xl border bg-card p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-pretty">{BONO_NAME}</p>
                  <p className="text-xs text-muted-foreground">Bono incluido · Google Drive</p>
                </div>
                <Button asChild variant="secondary" className="w-full md:w-auto whitespace-normal h-auto py-2">
                  <a href={BONO_URL} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" /> Abrir en Drive
                  </a>
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="text-pretty">
                    <strong>No compartas la clave</strong> con personas desconocidas.
                    Si tienes problemas para acceder, escríbeme por WhatsApp con tu
                    comprobante de compra.
                  </p>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 px-3 py-2 rounded-md bg-accent text-accent-foreground font-semibold hover:opacity-90 transition"
                  >
                    <MessageCircle className="w-4 h-4" /> Escribir por WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default DescargaIngles8000;
