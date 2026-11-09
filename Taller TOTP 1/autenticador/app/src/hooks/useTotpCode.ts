import { useEffect, useRef, useState } from "react";
import { generateTotp, secondsRemaining } from "../security/totp";

export function useTotpCode(secret: string | null) {
  const [code, setCode] = useState("");
  const [remaining, setRemaining] = useState(secondsRemaining());
  const requestId = useRef(0);

  useEffect(() => {
    if (!secret) {
      void Promise.resolve().then(() => {
        setCode("");
        setRemaining(secondsRemaining());
      });
      return;
    }
    let active = true;
    const update = async () => {
      const id = ++requestId.current;
      const nextCode = await generateTotp(secret);
      if (!active || id !== requestId.current) return;
      // Se calcula antes de reemplazar el anterior para evitar parpadeo.
      setCode(nextCode);
      setRemaining(secondsRemaining());
    };
    void update();
    const interval = setInterval(update, 250);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [secret]);

  return { code, remaining };
}
