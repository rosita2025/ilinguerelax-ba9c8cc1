import { useState, useCallback, useMemo } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRESETS = [
  { name: "5,000 Spanish Words (Digital)", price: 22 },
  { name: "100 Mapas Mentales Coreano", price: 25 },
  { name: "Patrones Especiales", price: 15 },
  { name: "Test $1", price: 1 },
];

export default function CheckoutTest() {
  const [productName, setProductName] = useState(PRESETS[0].name);
  const [amount, setAmount] = useState<number>(PRESETS[0].price);
  const [email, setEmail] = useState("");
  const [started, setStarted] = useState(false);

  const stripePromise = useMemo(() => getStripe(), []);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("create-test-checkout", {
      body: {
        environment: getStripeEnvironment(),
        productName,
        amountInCents: Math.round(amount * 100),
        currency: "usd",
        customerEmail: email || undefined,
        returnUrl: `${window.location.origin}/checkouts/return?session_id={CHECKOUT_SESSION_ID}`,
      },
    });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message || "No se pudo crear la sesión de pago");
    }
    return data.clientSecret;
  }, [productName, amount, email]);

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Prueba de Checkout</h1>
        <p className="text-muted-foreground mb-6">
          Crea una sesión de pago con Stripe Checkout Sessions API. Se muestra el formulario embebido abajo.
        </p>

        {!started ? (
          <Card>
            <CardHeader>
              <CardTitle>Configura la prueba</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <Button
                    key={p.name}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProductName(p.name);
                      setAmount(p.price);
                    }}
                  >
                    {p.name} · ${p.price}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prod">Producto</Label>
                <Input id="prod" value={productName} onChange={(e) => setProductName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amt">Monto (USD)</Label>
                <Input
                  id="amt"
                  type="number"
                  min={1}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (opcional)</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@ejemplo.com" />
              </div>

              <Button onClick={() => setStarted(true)} className="w-full" size="lg">
                Iniciar checkout — ${amount.toFixed(2)}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            <Button variant="ghost" onClick={() => setStarted(false)} className="mb-4">
              ← Cambiar configuración
            </Button>
            <div id="checkout" className="rounded-lg overflow-hidden border">
              <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
