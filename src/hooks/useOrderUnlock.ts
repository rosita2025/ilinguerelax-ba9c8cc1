import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Desbloqueo verificado en el servidor.
 *
 * Sustituye a las claves fijas escritas en el código del navegador (que
 * cualquiera podía leer y usar sin haber comprado). Ahora se comprueba el
 * número de pedido + correo contra la función `order-delivery`, que confirma
 * el pago en la base de datos antes de habilitar el acceso.
 */
export function useOrderUnlock(storageKey: string) {
  const [orderId, setOrderId] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const restore = useCallback(() => {
    if (sessionStorage.getItem(storageKey) === "yes") setUnlocked(true);
  }, [storageKey]);

  const verify = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (checking) return;
      setError("");

      const cleanOrder = orderId.trim().toUpperCase();
      const cleanEmail = buyerEmail.trim().toLowerCase();

      if (cleanOrder.length < 4) {
        setError("Ingresa el número de pedido que aparece en tu correo de compra.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        setError("Ingresa el correo con el que realizaste la compra.");
        return;
      }

      setChecking(true);
      try {
        const { data, error: fnError } = await supabase.functions.invoke("order-delivery", {
          body: { orderId: cleanOrder, email: cleanEmail },
        });
        if (fnError) throw fnError;

        if (data?.paid) {
          setUnlocked(true);
          sessionStorage.setItem(storageKey, "yes");
        } else {
          setError(
            "No encontramos un pago confirmado con esos datos. Revisa el número de pedido y el correo, o escríbenos por WhatsApp con tu comprobante.",
          );
        }
      } catch {
        setError("No pudimos verificar tu compra en este momento. Inténtalo de nuevo en unos minutos.");
      } finally {
        setChecking(false);
      }
    },
    [orderId, buyerEmail, checking, storageKey],
  );

  return {
    orderId,
    setOrderId,
    buyerEmail,
    setBuyerEmail,
    unlocked,
    error,
    checking,
    verify,
    restore,
  };
}
