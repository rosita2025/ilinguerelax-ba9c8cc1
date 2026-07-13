import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const contactSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  phone: z
    .string()
    .trim()
    .min(6, "Teléfono muy corto")
    .max(20, "Teléfono muy largo")
    .regex(/^[+\d\s()-]+$/, "Formato inválido"),
  firstName: z.string().trim().min(1, "Requerido").max(50),
  lastName: z.string().trim().min(1, "Requerido").max(50),
  country: z.string().min(2).max(2),
  acceptsMarketing: z.boolean().optional(),
});

export type ContactData = z.infer<typeof contactSchema>;

const COUNTRIES = [
  { code: "CO", name: "🇨🇴 Colombia" },
  { code: "PE", name: "🇵🇪 Perú" },
  { code: "MX", name: "🇲🇽 México" },
  { code: "CL", name: "🇨🇱 Chile" },
  { code: "AR", name: "🇦🇷 Argentina" },
  { code: "EC", name: "🇪🇨 Ecuador" },
  { code: "BO", name: "🇧🇴 Bolivia" },
  { code: "UY", name: "🇺🇾 Uruguay" },
  { code: "VE", name: "🇻🇪 Venezuela" },
  { code: "PY", name: "🇵🇾 Paraguay" },
  { code: "BR", name: "🇧🇷 Brasil" },
  { code: "US", name: "🇺🇸 Estados Unidos" },
  { code: "CA", name: "🇨🇦 Canadá" },
  { code: "ES", name: "🇪🇸 España" },
  { code: "FR", name: "🇫🇷 Francia" },
  { code: "DE", name: "🇩🇪 Alemania" },
  { code: "IT", name: "🇮🇹 Italia" },
  { code: "PT", name: "🇵🇹 Portugal" },
  { code: "GB", name: "🇬🇧 Reino Unido" },
  { code: "NL", name: "🇳🇱 Países Bajos" },
];

interface Props {
  onValid: (data: ContactData) => void;
  onChange?: (isValid: boolean, data: Partial<ContactData>) => void;
}

export function ContactForm({ onValid, onChange }: Props) {
  const form = useForm<ContactData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: "",
      phone: "",
      firstName: "",
      lastName: "",
      country: "CO",
      acceptsMarketing: false,
    },
    mode: "onChange",
  });

  // Auto-detect country by IP
  useEffect(() => {
    const cached = localStorage.getItem("ilr_country");
    if (cached && cached.length === 2) {
      form.setValue("country", cached.toUpperCase());
      return;
    }
    fetch("https://ipwho.is/")
      .then((r) => r.json())
      .then((d) => {
        if (d?.country_code && COUNTRIES.some((c) => c.code === d.country_code)) {
          form.setValue("country", d.country_code);
          try {
            localStorage.setItem("ilr_country", d.country_code);
          } catch {
            /* noop */
          }
        }
      })
      .catch(() => {
        /* noop */
      });
  }, [form]);

  useEffect(() => {
    const sub = form.watch((values) => {
      onChange?.(form.formState.isValid, values as Partial<ContactData>);
    });
    return () => sub.unsubscribe();
  }, [form, onChange]);

  return (
    <form onSubmit={form.handleSubmit(onValid)} className="space-y-6" id="checkout-contact-form">
      <section className="space-y-3">
        <h3 className="text-base font-semibold">Contacto</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="email" className="sr-only">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Correo electrónico"
              autoComplete="email"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone" className="sr-only">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Teléfono (+51 999 999 999)"
              autoComplete="tel"
              {...form.register("phone")}
            />
            {form.formState.errors.phone && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.phone.message}</p>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="rounded"
              {...form.register("acceptsMarketing")}
            />
            Enviarme novedades y ofertas por email
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold">Datos del comprador</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName" className="sr-only">Nombre</Label>
            <Input
              id="firstName"
              placeholder="Nombre"
              autoComplete="given-name"
              {...form.register("firstName")}
            />
            {form.formState.errors.firstName && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName" className="sr-only">Apellido</Label>
            <Input
              id="lastName"
              placeholder="Apellido"
              autoComplete="family-name"
              {...form.register("lastName")}
            />
            {form.formState.errors.lastName && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.lastName.message}
              </p>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="country" className="sr-only">País</Label>
          <Select
            value={form.watch("country")}
            onValueChange={(v) => form.setValue("country", v, { shouldValidate: true })}
          >
            <SelectTrigger id="country">
              <SelectValue placeholder="País" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>
    </form>
  );
}
