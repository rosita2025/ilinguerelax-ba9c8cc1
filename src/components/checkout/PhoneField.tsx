import PhoneInput from "react-phone-number-input/min";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";

// Se carga aparte (lazy) desde BuyerInfoForm: la librería de teléfonos con sus
// banderas pesaba ~300 KB dentro del primer paquete del checkout, y para
// productos digitales el campo ni siquiera se muestra de entrada.
export default function PhoneField(props: {
  defaultCountry: string;
  value: string;
  onChange: (v: string | undefined) => void;
  onBlur: () => void;
  className?: string;
}) {
  return (
    <PhoneInput
      flags={flags}
      international
      defaultCountry={props.defaultCountry as any}
      value={props.value}
      onChange={props.onChange}
      onBlur={props.onBlur}
      placeholder="999 999 999"
      className={props.className}
    />
  );
}
