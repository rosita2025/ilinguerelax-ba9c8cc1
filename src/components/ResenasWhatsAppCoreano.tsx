import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/navigation";
// @ts-ignore
import "swiper/css/pagination";
import { MessageCircle, ShieldCheck, Star, ChevronLeft, ChevronRight } from "lucide-react";
import r1 from "@/assets/resena-mapas-korea-1.webp.asset.json";
import r2 from "@/assets/resena-mapas-korea-2.webp.asset.json";
import r3 from "@/assets/resena-mapas-korea-3.webp.asset.json";

const resenas = [
  {
    src: (r1 as any).url || r1,
    contacto: "Comprador Verificado",
    telefono: "+54 9 11 **** 8822",
    pais: "Argentina 🇦🇷",
    resumen: "Exactamente fue rápido envío digital sin demoras. El listado de palabras es increíblemente visual."
  },
  {
    src: (r2 as any).url || r2,
    contacto: "Compradora Verificada",
    telefono: "+591 7 **** 4433",
    pais: "Bolivia 🇧🇴",
    resumen: "Excelente material. La atención de Rosa y Crady fue muy amable y el acceso fue inmediato."
  },
  {
    src: (r3 as any).url || r3,
    contacto: "Estudiante Verificada",
    telefono: "+52 55 **** 9012",
    pais: "México 🇲🇽",
    resumen: "Muy recomendado. La guía visual facilita mucho el aprendizaje de este idioma tan complejo."
  }
];


export const ResenasWhatsAppCoreano = () => {
  if (resenas.length === 0) return null;

  return (
    <section id="resenas-whatsapp-coreano" className="py-12 md:py-16 bg-gradient-to-b from-background to-muted/30 scroll-mt-20">
      <div className="container px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-bold mb-3">
              <MessageCircle className="w-4 h-4" /> Reseñas reales por WhatsApp
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3 text-balance">
              Lo que dicen nuestras <span className="text-gradient">compradoras verificadas</span>
            </h2>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-2 text-sm font-semibold text-foreground">5.0/5.0 · Reseñas verificadas</span>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty text-sm md:text-base">
              Conversaciones auténticas atendidas por <strong>Supervisora Rosa</strong> y <strong>Asistente Crady</strong>. Desliza para ver más.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-primary" /> Datos personales protegidos</span>
            </div>
          </div>

          <div className="relative">
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={16}
              slidesPerView={1}
              centeredSlides={true}
              loop={true}
              autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
              navigation={{ nextEl: ".resenas-next", prevEl: ".resenas-prev" }}
              pagination={{ clickable: true }}
              breakpoints={{
                640: { slidesPerView: 1.4 },
                1024: { slidesPerView: 2.2 },
              }}
              className="!pb-12"
            >
              {resenas.map((r, i) => (
                <SwiperSlide key={i} className="!h-auto">
                  <div className="rounded-2xl overflow-hidden border-2 border-green-500/20 bg-card shadow-md hover:shadow-xl transition-shadow h-full flex flex-col">
                    <div className="relative bg-black aspect-[9/16] w-full">
                      <img
                        src={r.src}
                        alt={`Reseña real WhatsApp · ${r.contacto} · ${r.pais}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain pointer-events-none select-none"
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    </div>
                    <div className="p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-foreground text-sm">{r.contacto}</p>
                          <p className="text-xs text-muted-foreground">{r.telefono}</p>
                        </div>
                        <span className="text-xs font-semibold text-foreground">{r.pais}</span>
                      </div>
                      <p className="text-sm text-foreground/90 leading-snug">{r.resumen}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, s) => (
                            <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
                            <MessageCircle className="w-3 h-3" /> WhatsApp verificado
                          </span>
                          <span className="text-[9px] text-muted-foreground italic leading-none">
                            Supervisora Rosa & Asistente Crady
                          </span>
                        </div>

                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <button
              type="button"
              aria-label="Anterior"
              className="resenas-prev absolute left-0 md:-left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white dark:bg-card border border-border shadow-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              className="resenas-next absolute right-0 md:-right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white dark:bg-card border border-border shadow-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4 max-w-xl mx-auto">
            Por privacidad, ocultamos nombres y números de las compradoras. Capturas reales verificadas.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ResenasWhatsAppCoreano;
