import { ticketKeys } from "@/application/queryKeys/ticket.queryKeys";
import { supabase } from "@/shared/utils/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { BellOff, BellRing } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { toast } from "sonner";

const SOUND_STORAGE_KEY = "support-ticket-sound-enabled";
const SOUND_PATH = "/sounds/nuevo-ticket.mp3";

type ConnectionStatus = "connecting" | "connected" | "error";

const SupportRealtimeControls = () => {
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem(SOUND_STORAGE_KEY) === "true",
  );

  const getAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(SOUND_PATH);
      audioRef.current.preload = "auto";
    }
    return audioRef.current;
  };

  const playAlert = async () => {
    const audio = getAudio();
    audio.currentTime = 0;
    await audio.play();
  };

  const toggleSound = async () => {
    if (soundEnabled) {
      audioRef.current?.pause();
      localStorage.setItem(SOUND_STORAGE_KEY, "false");
      setSoundEnabled(false);
      return;
    }

    try {
      await playAlert();
      localStorage.setItem(SOUND_STORAGE_KEY, "true");
      setSoundEnabled(true);
      toast.success("Alertas sonoras activadas");
    } catch {
      toast.error(`No pudimos reproducir ${SOUND_PATH}`);
    }
  };

  const handleTicketChange = useEffectEvent((eventType: string) => {
    queryClient.invalidateQueries({ queryKey: ticketKeys.support() });

    if (eventType === "INSERT") {
      toast.info("Nuevo ticket recibido");

      if (soundEnabled) {
        void playAlert().catch(() => {
          localStorage.setItem(SOUND_STORAGE_KEY, "false");
          setSoundEnabled(false);
          toast.error("El navegador bloqueó la alerta sonora. Actívala nuevamente.");
        });
      }
    }
  });

  useEffect(() => {
    const channel = supabase
      .channel("support-ticket-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        (payload) => handleTicketChange(payload.eventType),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
          queryClient.invalidateQueries({ queryKey: ticketKeys.support() });
          return;
        }

        setConnectionStatus(
          status === "CHANNEL_ERROR" || status === "TIMED_OUT" ? "error" : "connecting",
        );
      });

    return () => {
      void supabase.removeChannel(channel);
      audioRef.current?.pause();
    };
  }, [queryClient]);

  const statusLabel =
    connectionStatus === "connected"
      ? "En vivo"
      : connectionStatus === "error"
        ? "Sin conexión"
        : "Conectando";

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <div
        className="flex items-center gap-2 text-xs font-bold"
        role="status"
        aria-live="polite"
        aria-label={`Realtime: ${statusLabel}`}
      >
        <span
          className={`status ${
            connectionStatus === "connected"
              ? "status-success"
              : connectionStatus === "error"
                ? "status-error"
                : "status-warning"
          }`}
        />
        <span className="hidden md:inline">{statusLabel}</span>
      </div>
      <button
        type="button"
        className={`btn btn-ghost btn-sm ${soundEnabled ? "btn-active" : ""}`}
        onClick={() => void toggleSound()}
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? "Desactivar alertas sonoras" : "Activar alertas sonoras"}
        title={soundEnabled ? "Desactivar sonido" : "Activar sonido"}
      >
        {soundEnabled ? (
          <BellRing className="size-4" aria-hidden="true" />
        ) : (
          <BellOff className="size-4" aria-hidden="true" />
        )}
        <span className="hidden xl:inline">{soundEnabled ? "Sonido activo" : "Activar sonido"}</span>
      </button>
    </div>
  );
};

export default SupportRealtimeControls;
