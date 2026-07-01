import { useState } from "react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Download, ShieldAlert, FileText, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import pdfAsset from "@/assets/100-mapas-mentales-coreano-completado.pdf.asset.json";

const ACCESS_KEY = "123456";
const FILE_NAME = "100 Mapas Mentales de Coreano - Completado";

const DescargaCoreano = () => {
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim() === ACCESS_KEY) {
      setUnlocked(true);
      setError("");
    } else {
      setError("Clave incorrecta. Intenta de nuevo.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <SEO
        title="Descarga +100 Mapas Mentales Coreano · Protegida"
        description="Descarga protegida del PDF +100 Mapas Mentales con iLustrador (Versión 1.1). Solo para compradores verificados."
      />
      <Navbar />

      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Lock className="w-4 h-4" /> Descarga protegida
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            +100 Mapas Mentales en forma fácil, visual y efectiva
          </h1>
          <p className="text-muted-foreground">
            Archivo único: <strong>{FILE_NAME}</strong>
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
                <li>• <strong>NO compartas este archivo</strong> con personas desconocidas ni en grupos públicos.</li>
                <li>• Este material está <strong>protegido por derechos de autor</strong> y es de uso personal.</li>
                <li>• La clave de acceso es exclusiva para compradores verificados.</li>
                <li>• Compartirlo con terceros perjudica al autor y puede tener consecuencias legales.</li>
                <li>• Evita que gente desconocida robe el contenido — guarda tu clave en privado.</li>
              </ul>
            </div>
          </div>
        </div>

        {!unlocked ? (
          <motion.form
            onSubmit={handleUnlock}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border bg-card p-8 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">Ingresa la clave de acceso</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              💡 La clave es <strong>123456</strong> (uso exclusivo de compradores).
            </p>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Clave de acceso"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="text-lg h-12 mb-3"
              autoFocus
            />
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            <Button type="submit" size="lg" className="w-full">
              <Lock className="w-4 h-4 mr-2" /> Desbloquear descarga
            </Button>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-8 text-center"
          >
            <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">¡Acceso desbloqueado!</h3>
            <p className="text-muted-foreground mb-6">
              {FILE_NAME}
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-500 hover:to-yellow-600 font-bold">
              <a href={pdfAsset.url} download={`${FILE_NAME}.pdf`} target="_blank" rel="noopener noreferrer">
                <Download className="w-5 h-5 mr-2" /> Descargar PDF
              </a>
            </Button>
            <p className="text-xs text-muted-foreground mt-6">
              🔒 Recuerda: este archivo es solo para ti. No lo reenvíes ni lo subas a redes públicas.
            </p>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default DescargaCoreano;
