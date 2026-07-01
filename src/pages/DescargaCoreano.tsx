import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Download, ShieldAlert, FileText, KeyRound, Eye, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import pdfAsset from "@/assets/100-mapas-mentales-coreano-completado.pdf.asset.json";
import bono1Asset from "@/assets/bono-1-alfabeto-hangul-coreano.pdf.asset.json";
import bono2Asset from "@/assets/bono-2-guia-completa-hangul.pdf.asset.json";

const FILE_NAME = "+100 Mapas Mentales de Coreano";
const BONO1_NAME = "Bono 1 - Guía Alfabético Hangul con Manos Escritura";
const BONO2_NAME = "Bono 2 - Guía Completa Hangul (Explicativo + Notas)";

type AccessStatus =
  | "idle"
  | "loading"
  | "preview_only"
  | "full_access"
  | "refunded"
  | "cancelled"
  | "chargeback"
  | "not_found"
  | "error";

const DescargaCoreano = () => {
  const [email, setEmail] = useState("");
  const [txCode, setTxCode] = useState("");
  const [status, setStatus] = useState<AccessStatus>("idle");
  const [error, setError] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [refundDeadline, setRefundDeadline] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState(0);

  // Block Ctrl+P / Ctrl+S / right-click while previewing
  useEffect(() => {
    if (status !== "preview_only") return;
    const blockKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["p", "s", "u"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const blockCtx = (e: MouseEvent) => e.preventDefault();
    window.addEventListener("keydown", blockKeys);
    window.addEventListener("contextmenu", blockCtx);
    return () => {
      window.removeEventListener("keydown", blockKeys);
      window.removeEventListener("contextmenu", blockCtx);
    };
  }, [status]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("verify-coreano-access", {
        body: { email: email.trim(), transaction_code: txCode.trim() },
      });
      if (fnErr) throw fnErr;
      const s: AccessStatus = data?.status ?? "not_found";
      setStatus(s);
      setBuyerEmail(data?.email ?? email.trim());
      setRefundDeadline(data?.refund_deadline ?? null);
      if (data?.refund_deadline) {
        const d = Math.max(0, Math.ceil((new Date(data.refund_deadline).getTime() - Date.now()) / 864e5));
        setDaysLeft(d);
      }
      if (s === "not_found") setError("No encontramos tu compra. Revisa el email y el código de transacción del correo de Hotmart.");
      if (s === "refunded") setError("Esta compra fue reembolsada. El acceso quedó cancelado.");
      if (s === "chargeback") setError("Compra marcada como chargeback. Contacta a hola@ilinguerelax.com.");
      if (s === "cancelled") setError("Compra cancelada. Contacta a hola@ilinguerelax.com.");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError("Error verificando tu compra. Intenta de nuevo o escribe a hola@ilinguerelax.com.");
    }
  };

  const isPreview = status === "preview_only";
  const isFull = status === "full_access";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 no-print">
      <style>{`@media print { body { display: none !important; } }`}</style>
      <SEO
        title="Descarga +100 Mapas Mentales Coreano · Protegida"
        description="Acceso protegido para compradores de +100 Mapas Mentales de Coreano."
      />
      <Navbar />

      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Lock className="w-4 h-4" /> Acceso protegido para compradores
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            +100 Mapas Mentales de Coreano
          </h1>
          <p className="text-muted-foreground text-sm">
            Verifica tu compra con el email y el código de Hotmart
          </p>
        </motion.div>

        {/* Aviso importante */}
        <div className="rounded-2xl border-2 border-red-500/40 bg-red-500/5 p-6 mb-8">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
                ⚠️ AVISO IMPORTANTE
              </h2>
              <ul className="space-y-2 text-sm leading-relaxed">
                <li>• Durante los <strong>primeros 7 días</strong> (periodo de reembolso Hotmart) solo puedes <strong>ver</strong> el material — no descargar ni imprimir.</li>
                <li>• A partir del <strong>día 8</strong>, cuando finaliza la ventana de reembolso, se activan los botones de descarga e impresión.</li>
                <li>• Cada página incluye tu email como marca de agua — cualquier fuga se rastrea al comprador.</li>
                <li>• Este material está protegido por derechos de autor. NO lo compartas con terceros.</li>
                <li>• ¿No recibiste el código? Escríbenos a <strong>hola@ilinguerelax.com</strong> con tu comprobante.</li>
              </ul>
            </div>
          </div>
        </div>

        {status === "idle" || status === "loading" || status === "error" || status === "not_found" || status === "refunded" || status === "cancelled" || status === "chargeback" ? (
          <motion.form
            onSubmit={handleUnlock}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border bg-card p-6 md:p-8 shadow-lg space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">Verifica tu compra</h3>
            </div>
            <div>
              <Label htmlFor="email">Email de compra (Hotmart)</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="tx">Código de transacción</Label>
              <Input
                id="tx"
                type="text"
                placeholder="HP12345678901234"
                value={txCode}
                onChange={(e) => setTxCode(e.target.value)}
                className="h-12 font-mono"
                required
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Está en tu email de confirmación de Hotmart, empieza con "HP" o similar.
              </p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={status === "loading"}>
              {status === "loading" ? "Verificando..." : <><Lock className="w-4 h-4 mr-2" /> Verificar y acceder</>}
            </Button>
          </motion.form>
        ) : null}

        {/* PREVIEW MODE (dias 0-7) */}
        {isPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-500/5 p-4 flex items-center gap-3">
              <Clock className="w-6 h-6 text-amber-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  Modo previsualización · Quedan {daysLeft} día{daysLeft !== 1 ? "s" : ""} de reembolso
                </p>
                <p className="text-xs text-muted-foreground">
                  Podrás descargar e imprimir después del {refundDeadline ? new Date(refundDeadline).toLocaleDateString() : "día 8"}.
                </p>
              </div>
            </div>

            <PreviewViewer title={FILE_NAME} url={pdfAsset.url} watermark={buyerEmail} />
            <PreviewViewer title={BONO1_NAME} url={bono1Asset.url} watermark={buyerEmail} />
            <PreviewViewer title={BONO2_NAME} url={bono2Asset.url} watermark={buyerEmail} />

            <p className="text-xs text-muted-foreground text-center">
              🔒 Este acceso es exclusivo para {buyerEmail}. No compartas la URL.
            </p>
          </motion.div>
        )}

        {/* FULL ACCESS (día 8+) */}
        {isFull && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-8 text-center"
          >
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">¡Acceso completo desbloqueado!</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Periodo de reembolso finalizado. Ya puedes descargar e imprimir libremente.
            </p>
            <div className="flex flex-col gap-3 items-stretch">
              <Button asChild size="lg" className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-500 hover:to-yellow-600 font-bold w-full whitespace-normal h-auto py-3 text-sm sm:text-base leading-tight">
                <a href={pdfAsset.url} download={`${FILE_NAME}.pdf`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-center">
                  <Download className="w-5 h-5 flex-shrink-0" />
                  <span>+100 Mapas Mentales de Coreano</span>
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-primary/50 font-bold w-full whitespace-normal h-auto py-3 text-sm sm:text-base leading-tight">
                <a href={bono1Asset.url} download={`${BONO1_NAME}.pdf`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-center">
                  <Download className="w-5 h-5 flex-shrink-0" />
                  <span>🎁 Bono 1: Guía Alfabético Hangul</span>
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-primary/50 font-bold w-full whitespace-normal h-auto py-3 text-sm sm:text-base leading-tight">
                <a href={bono2Asset.url} download={`${BONO2_NAME}.pdf`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-center">
                  <Download className="w-5 h-5 flex-shrink-0" />
                  <span>🎁 Bono 2: Guía Completa Hangul</span>
                </a>
              </Button>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

const PreviewViewer = ({ title, url, watermark }: { title: string; url: string; watermark: string }) => (
  <div className="rounded-xl border bg-card overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/40">
      <Eye className="w-4 h-4 text-primary" />
      <span className="font-medium text-sm">{title}</span>
    </div>
    <div className="relative aspect-[4/5] w-full">
      <iframe
        src={`${url}#toolbar=0&navpanes=0&scrollbar=1`}
        title={title}
        className="absolute inset-0 w-full h-full"
        sandbox="allow-scripts allow-same-origin"
      />
      {/* Watermark overlay */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden select-none"
        style={{
          backgroundImage: `repeating-linear-gradient(-30deg, transparent 0 200px, transparent 200px 400px)`,
        }}
      >
        <div
          className="absolute inset-0 flex flex-wrap items-start justify-start opacity-30"
          style={{ transform: "rotate(-30deg) scale(1.4)", transformOrigin: "center" }}
        >
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="text-red-600 font-bold text-sm md:text-base whitespace-nowrap m-6">
              {watermark} · ILINGUE RELAX · {new Date().toLocaleDateString()}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default DescargaCoreano;
