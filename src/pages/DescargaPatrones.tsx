import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Download, ShieldAlert, FileText, KeyRound, MessageCircle, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useOrderUnlock } from "@/hooks/useOrderUnlock";
import patronesAsset from "@/assets/patrones-especiales-v1.1.pdf.asset.json";
import palabrasAsset from "@/assets/1000-palabras-ingles-vip-v1.3.pdf.asset.json";

const FILE_1_NAME = "Patrones Especiales del Alfabeto · Combinaciones Secretas (Inglés) v1.1";
const FILE_2_NAME = "1.000 Palabras en Inglés con Pronunciación en Español · VIP v1.3";
const WHATSAPP_URL = "https://wa.me/12512724704";

const DescargaPatrones = () => {
  const {
    orderId,
    setOrderId,
    buyerEmail,
    setBuyerEmail,
    unlocked,
    error,
    checking,
    verify,
    restore,
  } = useOrderUnlock("patrones_unlocked");
  const [emailCaptured, setEmailCaptured] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    restore();
    const emailDone = localStorage.getItem("patrones_email_captured");
    if (emailDone === "yes") setEmailCaptured(true);
  }, [restore]);


  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError("Ingresa un correo válido.");
      return;
    }

    supabase.functions
      .invoke("register-download-email", {
        body: {
          email: cleanEmail,
          name: name.trim() || undefined,
          productName: "Patrones Especiales en Inglés",
          productSlug: "patrones-ingles",
        },
      })
      .catch((err) => console.warn("register-download-email error:", err));

    localStorage.setItem("patrones_email_captured", "yes");
    setEmailCaptured(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Descarga · Patrones Especiales en Inglés | ILINGUE RELAX"
        description="Área privada de descarga para compradores del producto Patrones Especiales en Inglés."
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
              <h1 className="text-2xl md:text-3xl font-bold text-balance">Área privada de descarga</h1>
              <p className="text-muted-foreground mt-2 text-pretty">
                Ingresa la clave que recibiste en tu correo de compra para acceder al material.
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
                    No compartas la clave con nadie. Si ya pagaste por PayPal o Stripe, escríbeme por WhatsApp y envíame
                    tu comprobante de pago (captura) para validar tu acceso.
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
        ) : !emailCaptured ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border bg-card p-6 md:p-10 shadow-sm"
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-balance">Último paso: confirma tu correo</h1>
              <p className="text-muted-foreground mt-2 text-pretty">
                Guardaremos tu correo para enviarte respaldo del material y avisos de nuevos productos de ILINGUE RELAX.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Label htmlFor="patrones-dl-name">Tu nombre (opcional)</Label>
                <Input
                  id="patrones-dl-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. María"
                  className="mt-2"
                  maxLength={80}
                  autoComplete="given-name"
                />
              </div>
              <div>
                <Label htmlFor="patrones-dl-email">Correo electrónico</Label>
                <Input
                  id="patrones-dl-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="mt-2"
                  maxLength={255}
                  required
                  autoComplete="email"
                />
              </div>
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
              <Button type="submit" className="w-full">
                Continuar a la descarga
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Al continuar aceptas recibir avisos ocasionales. Puedes darte de baja en cualquier momento.
              </p>
            </form>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-balance">¡Descarga desbloqueada! 🎉</h1>
              <p className="text-muted-foreground mt-2 text-pretty">
                Guarda estos archivos en tu dispositivo. Son de uso personal.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-xl border bg-card p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-pretty">{FILE_1_NAME}</p>
                  <p className="text-xs text-muted-foreground">PDF principal</p>
                </div>
                <Button asChild className="w-full md:w-auto whitespace-normal h-auto py-2">
                  <a href={patronesAsset.url} download target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" /> Descargar
                  </a>
                </Button>
              </div>

              <div className="rounded-xl border bg-card p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-pretty">{FILE_2_NAME}</p>
                  <p className="text-xs text-muted-foreground">Bono incluido</p>
                </div>
                <Button asChild variant="secondary" className="w-full md:w-auto whitespace-normal h-auto py-2">
                  <a href={palabrasAsset.url} download target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" /> Descargar
                  </a>
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="text-pretty">
                    <strong>No compartas la clave</strong> con personas desconocidas. Si pagaste por PayPal o Stripe,
                    escríbeme por WhatsApp y envíame la captura del comprobante de pago para confirmar tu compra.
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

export default DescargaPatrones;
