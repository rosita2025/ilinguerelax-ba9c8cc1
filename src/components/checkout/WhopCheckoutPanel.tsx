import { Component, type ReactNode } from "react";
import { Checkout, CheckoutElement, WhopElements } from "@whop/elements-react";
import { loadWhop } from "@whop/elements";
import { logCheckoutAction } from "@/hooks/useMetaPixel";

/**
 * Checkout incrustado de Whop (billetera digital en Colombia: Nequi). Se carga bajo demanda desde PaymentMethodsGroup.
 * El precio lo fija la configuración de checkout que creó nuestro servidor para este pedido (`order_id` va en su metadata), y la entrega la hace el aviso
 * `payment.succeeded` (`whop-webhook`), nunca esta pantalla.
 */
type PanelProps = { checkoutConfiguration: string; orderId: string; email: string; phone?: string; name?: string; country?: string; language?: string; onFail?: () => void };

/** Si el script de Whop no carga (sin conexión a su CDN, bloqueador de anuncios…) el pago NO debe romper el resto del checkout: se avisa y se usa la billetera de dLocal. */
class WhopBoundary extends Component<{ onFail?: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) {
    console.error("[whop] el checkout no cargó:", error);
    logCheckoutAction("whop_no_cargo");
    this.props.onFail?.();
  }
  render() {
    if (this.state.failed) {
      return <div className="p-4 text-center text-xs text-neutral-500">No pudimos abrir este pago. Te llevamos a otra billetera…</div>;
    }
    return this.props.children;
  }
}

export default function WhopCheckoutPanel(props: PanelProps) {
  return (
    <WhopBoundary onFail={props.onFail}>
      <WhopCheckoutInner {...props} />
    </WhopBoundary>
  );
}

function WhopCheckoutInner({ checkoutConfiguration, orderId, email, phone, name, country, language }: PanelProps) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const whopReturn = `${base}/checkouts/return?provider=whop&order=${encodeURIComponent(orderId)}`;
  return (
    <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 sm:p-4">
      <WhopElements elements={loadWhop()}>
        <Checkout
          checkoutConfiguration={checkoutConfiguration}
          locale={(["es", "en", "pt", "fr", "it"] as const).find((l) => l === language) ?? "es"}
          returnUrl={whopReturn}
          onComplete={(c) => {
            if (c.result === "payment") {
              logCheckoutAction("whop_pago_completado", orderId);
              // El producto se entrega desde el aviso de Whop: aquí solo se muestra que se está confirmando.
              window.location.assign(`${whopReturn}&payment=${encodeURIComponent(c.paymentId)}&status=succeeded`);
            }
          }}
        >
          <CheckoutElement
            buyerEmail={email}
            lockBuyerEmail
            // El país y el nombre ya los sabemos: Whop los usa donde pueda (el país por defecto de su formulario no siempre es el del comprador).
            defaultValues={{ ...(phone ? { phone } : {}), shippingAddress: { ...(name ? { name } : {}), ...(country ? { country } : {}) } }}
          />
        </Checkout>
      </WhopElements>
    </div>
  );
}
