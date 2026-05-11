import { BadgeCheck, BookOpen, GraduationCap, Globe, Sparkles } from "lucide-react";
import authorPhoto from "@/assets/loox-review-7.png";
import readingPhoto from "@/assets/crady-reading-spanish-relax.webp";

export const MeetTheAuthor = () => {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-secondary/30">
      <div className="container px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <BadgeCheck className="w-3.5 h-3.5" />
              Meet the Author
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
              Hi, I'm <span className="text-primary">Crady</span> — creator of Spanish Relax
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 md:gap-10 items-center bg-white rounded-3xl border border-border shadow-card p-5 md:p-8">
            {/* Photo */}
            <div className="relative mx-auto md:mx-0">
              <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden border-4 border-white shadow-hero">
                <img
                  src={authorPhoto}
                  alt="Crady, author of Spanish Relax"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute -bottom-3 -right-3 bg-primary text-primary-foreground rounded-full p-2.5 shadow-lg">
                <BadgeCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Bio + credentials */}
            <div>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-5">
                I created the <strong className="text-foreground">Spanish Relax method</strong> after
                years teaching Spanish to English speakers. My goal is simple: make learning feel
                <strong className="text-foreground"> calm, clear, and natural</strong> — never
                overwhelming. Every chapter is designed so you progress without stress.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Credential
                  icon={GraduationCap}
                  title="10+ years teaching"
                  desc="Spanish for English speakers"
                />
                <Credential
                  icon={BookOpen}
                  title="50,000+ readers"
                  desc="Across the iLingue Relax catalog"
                />
                <Credential
                  icon={Globe}
                  title="Bilingual method"
                  desc="USA · UK · Canada · Australia"
                />
                <Credential
                  icon={Sparkles}
                  title="Spanish Relax method"
                  desc="A1 to C1 in 6 calm months"
                />
              </div>

              <blockquote className="mt-5 pl-4 border-l-4 border-primary/40 text-sm md:text-base italic text-foreground/80">
                "If a method makes you feel relaxed, you'll keep going. That's how real fluency is
                built." — Crady
              </blockquote>

              {/* Lifestyle photo — reading the Spanish Relax book */}
              <div className="mt-5 rounded-2xl overflow-hidden border border-border shadow-sm">
                <img
                  src={readingPhoto}
                  alt="Reader enjoying the Spanish Relax book in a calm environment"
                  className="w-full h-auto object-cover aspect-[16/10]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Credential = ({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) => (
  <div className="flex items-start gap-3 bg-secondary/40 rounded-xl p-3">
    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4.5 h-4.5 text-primary" />
    </div>
    <div>
      <div className="text-sm font-bold text-foreground leading-tight">{title}</div>
      <div className="text-xs text-muted-foreground leading-snug">{desc}</div>
    </div>
  </div>
);

export default MeetTheAuthor;