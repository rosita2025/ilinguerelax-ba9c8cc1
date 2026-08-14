import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Activity, Bug, DollarSign, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PixelEvent {
  timestamp: string;
  eventName: string;
  params: any;
  eventId: string;
  status: 'pending' | 'sent' | 'error';
}

export const PixelDebugger = () => {
  const [events, setEvents] = useState<PixelEvent[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Solo visible en desarrollo (localhost/preview) o con flag manual
    const isDev = window.location.hostname === "localhost" || 
                  window.location.hostname.includes("lovable.app") ||
                  window.location.hostname.includes("lovableproject.com");
                  
    const isDebug = new URLSearchParams(window.location.search).get("pixel_debug") === "1";
    
    if (isDev || isDebug) {
      setIsVisible(true);
    } else {
      return;
    }

    // Intercept fbq calls
    const originalFbq = (window as any).fbq;
    (window as any).fbq = function(...args: any[]) {
      if (args[0] === 'track') {
        const eventName = args[1];
        const params = args[2];
        const eventId = params?.eventID || "n/a";
        
        const newEvent: PixelEvent = {
          timestamp: new Date().toLocaleTimeString(),
          eventName,
          params,
          eventId,
          status: 'sent'
        };

        setEvents(prev => [newEvent, ...prev].slice(0, 50));
      }
      
      if (typeof originalFbq === 'function') {
        return originalFbq.apply(window, args);
      }
    };

    return () => {
      (window as any).fbq = originalFbq;
    };
  }, []);

  if (!isVisible) return null;

  const filteredEvents = events.filter(e => 
    e.eventName.toLowerCase().includes(filter.toLowerCase()) ||
    JSON.stringify(e.params).toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[450px] max-h-[600px] shadow-2xl border-2 border-teal-500/20 bg-background/95 backdrop-blur-md rounded-xl overflow-hidden flex flex-col">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b bg-teal-500/5">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-teal-500" />
            <CardTitle className="text-sm font-bold tracking-tight">Meta Pixel Real-Time Debugger</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0 flex flex-col h-[500px]">
          <div className="p-2 border-b">
            <Input 
              placeholder="Filtrar eventos..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          
          <ScrollArea className="flex-1">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent text-[10px] uppercase tracking-wider">
                  <TableHead className="h-8 w-20">Hora</TableHead>
                  <TableHead className="h-8">Evento</TableHead>
                  <TableHead className="h-8 text-right">Value (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground text-xs italic">
                      Esperando eventos de Meta Pixel...
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event, i) => {
                    const value = event.params?.value;
                    const currency = event.params?.currency;
                    
                    // Extraer SKU(s) para comparar con USD Regional
                    const skus = Array.isArray(event.params?.content_ids) ? event.params.content_ids : [];
                    const contentName = event.params?.content_name || "";
                    
                    const isCorrectFormat = typeof value === 'number' && 
                                          (value.toFixed(2) === String(value) || 
                                           (String(value).includes('.') && String(value).split('.')[1].length === 2));
                    
                    return (
                      <TableRow key={i} className="text-xs group hover:bg-teal-500/5 transition-colors">
                        <TableCell className="py-2 text-muted-foreground font-mono">{event.timestamp}</TableCell>
                        <TableCell className="py-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-teal-700">{event.eventName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono truncate w-32" title={event.eventId}>
                              ID: {event.eventId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 font-mono font-bold">
                              {value !== undefined ? (
                                <>
                                  <span className={isCorrectFormat ? "text-green-600" : "text-amber-500"}>
                                    ${Number(value).toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">{currency || 'USD'}</span>
                                </>
                              ) : (
                                <span className="text-muted-foreground italic">n/a</span>
                              )}
                            </div>
                            {value !== undefined && (
                              <div className="flex flex-col items-end gap-1 mt-1 text-[9px]">
                                {isCorrectFormat ? (
                                  <span className="flex items-center gap-0.5 text-green-600 font-medium">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> 2 decimals OK
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-0.5 text-red-500 font-bold animate-pulse">
                                    <AlertCircle className="w-2.5 h-2.5" /> ERROR: NO 2 DECIMALS
                                  </span>
                                )}
                                <span className="text-[8px] text-muted-foreground italic">
                                  ROAS Precision Check
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="p-3 border-t bg-muted/30 text-[10px] text-muted-foreground space-y-1">
            <p className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-teal-500" />
              Depurando valores USD (Normalizados forzados)
            </p>
            <p className="flex items-center gap-1 italic">
              * El Pixel recibe siempre USD independientemente de la moneda local del carrito.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
