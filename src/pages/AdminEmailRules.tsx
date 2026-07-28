import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2, ShieldCheck, ShieldX, Wand2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminNav from "@/components/admin/AdminNav";
import { useAdminKey } from "@/components/admin/AdminGate";

type Rule = {
  id: string;
  list_type: "allow" | "block" | "typo";
  kind: "domain" | "tld" | "email" | "typo";
  value: string;
  maps_to: string | null;
  note: string | null;
  enabled: boolean;
};

const TABS: Array<{ key: Rule["list_type"]; label: string; icon: typeof ShieldCheck }> = [
  { key: "allow", label: "Lista blanca", icon: ShieldCheck },
  { key: "block", label: "Lista negra", icon: ShieldX },
  { key: "typo", label: "Correcciones", icon: Wand2 },
];

export default function AdminEmailRules() {
  const { adminKey } = useAdminKey();
  const [rules, setRules] = useState<Rule[]>([]);
  const [tab, setTab] = useState<Rule["list_type"]>("block");
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState("");
  const [mapsTo, setMapsTo] = useState("");
  const [kind, setKind] = useState<Rule["kind"]>("domain");
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{ ok: boolean; email: string; corrected: boolean; reason?: string } | null>(null);

  const call = async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("manage-email-rules", {
      body: { adminKey, ...payload },
    });
    if (error) throw error;
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
    return data as Record<string, unknown>;
  };

  const load = async () => {
    if (!adminKey) return;
    setLoading(true);
    try {
      const res = await call({ action: "list" });
      setRules((res.rules as Rule[]) ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [adminKey]);

  const add = async () => {
    const v = value.trim().toLowerCase();
    if (!v) return;
    if (tab === "typo" && !mapsTo.trim()) { toast.error("Indica el dominio correcto"); return; }
    try {
      await call({ action: "add", list_type: tab, kind: tab === "typo" ? "typo" : kind, value: v, maps_to: mapsTo.trim() || null });
      setValue(""); setMapsTo("");
      toast.success("Regla guardada");
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
  };

  const toggle = async (r: Rule) => {
    try { await call({ action: "toggle", id: r.id, enabled: !r.enabled }); load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
  };

  const remove = async (r: Rule) => {
    try { await call({ action: "delete", id: r.id }); toast.success("Eliminada"); load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
  };

  const runTest = async () => {
    if (!testEmail.trim()) return;
    try {
      const res = await call({ action: "test", email: testEmail.trim() });
      setTestResult(res.result as typeof testResult);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
  };

  const visible = rules.filter((r) => r.list_type === tab);

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold">Correos · Lista negra y blanca</h1>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Se aplica antes de enviar cualquier correo por Brevo (carritos abandonados, newsletter y confirmaciones),
          así no se gasta consumo en correos falsos, desechables o mal escritos.
        </p>

        <Card className="p-4 space-y-3">
          <div className="text-sm font-semibold">Probar un correo</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="cliente@yahoo.com.mxm" />
            <Button onClick={runTest}>Probar</Button>
          </div>
          {testResult && (
            <div className="text-sm">
              <Badge variant={testResult.ok ? "default" : "destructive"}>{testResult.ok ? "Aceptado" : "Bloqueado"}</Badge>
              <span className="ml-2 font-mono">{testResult.email}</span>
              {testResult.corrected && <span className="ml-2 text-emerald-600">(corregido)</span>}
              {testResult.reason && <span className="ml-2 text-muted-foreground">motivo: {testResult.reason}</span>}
            </div>
          )}
        </Card>

        <div className="flex gap-2 flex-wrap">
          {TABS.map(({ key, label, icon: Icon }) => (
            <Button key={key} size="sm" variant={tab === key ? "default" : "outline"} onClick={() => setTab(key)}>
              <Icon className="h-4 w-4 mr-1" />{label}
            </Button>
          ))}
        </div>

        <Card className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            {tab !== "typo" && (
              <select
                className="h-10 rounded-md border bg-background px-2 text-sm"
                value={kind}
                onChange={(e) => setKind(e.target.value as Rule["kind"])}
              >
                <option value="domain">Dominio</option>
                <option value="tld">TLD</option>
                <option value="email">Correo exacto</option>
              </select>
            )}
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={tab === "typo" ? "yahoo.com.mxm" : kind === "tld" ? "zzz" : "mailinator.com"}
            />
            {tab === "typo" && (
              <Input value={mapsTo} onChange={(e) => setMapsTo(e.target.value)} placeholder="yahoo.com.mx" />
            )}
            <Button onClick={add}>Agregar</Button>
          </div>

          <div className="divide-y">
            {visible.length === 0 && <div className="text-sm text-muted-foreground py-4">Sin reglas.</div>}
            {visible.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-2">
                <Switch checked={r.enabled} onCheckedChange={() => toggle(r)} />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm truncate">
                    {r.value}{r.maps_to ? ` → ${r.maps_to}` : ""}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{r.kind}{r.note ? ` · ${r.note}` : ""}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(r)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
