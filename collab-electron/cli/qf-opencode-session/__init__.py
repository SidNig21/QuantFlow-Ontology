"""Supply OpenCode routing identity from the current QuantFlow participant.

Hermes discovers this override in the disposable participant profile; its
existing provider client consumes default_headers without another transport.
"""

import os
import re
import logging
import base64
import json
from dataclasses import replace

from providers import get_provider_profile, register_provider

session_id = os.environ.get("QF_AGENT_SESSION_ID", "")
if not re.fullmatch(r"[a-zA-Z0-9_-]+", session_id):
    raise RuntimeError("QuantFlow participant session identity is required")

profile = get_provider_profile("opencode-go")
if profile is None:
    raise RuntimeError("Hermes OpenCode provider profile is unavailable")
register_provider(replace(
    profile,
    default_headers={**profile.default_headers, "x-opencode-session": session_id},
))

# Observe the runtime's literal terminal-failure record, never model text or
# exception contents. Ordinary stream reconnects do not emit this record.
class QuantFlowFailureHandler(logging.Handler):
    def control(self, kind, nonce, payload=""):
        os.write(1, f"\x1b]777;QF;{kind};{nonce};{payload}\x07".encode())

    def emit(self, record):
        nonce = os.environ.get("QF_RUNTIME_FAILURE_NONCE", "")
        safe_nonce = re.fullmatch(r"[a-zA-Z0-9-]+", nonce)
        if (record.name == "run_agent" and record.levelno == logging.WARNING
                and record.msg == "Streaming failed after partial delivery, not retrying: %s"
                and safe_nonce):
            self.control("STREAM_FAILURE", nonce)
            return
        if (record.name == "run_agent" and record.levelno == logging.INFO
                and record.msg == "Streaming failed before delivery: %s" and safe_nonce):
            error = record.args[0] if isinstance(record.args, tuple) and len(record.args) == 1 else None
            status = getattr(error, "status", getattr(error, "status_code", getattr(getattr(error, "response", None), "status_code", None)))
            if status == 429:
                self.control("PROVIDER_UNAVAILABLE", nonce)
            return
        if (record.name == "run_agent" and record.levelno == logging.INFO
                and record.msg == "API call #%d: model=%s provider=%s in=%d out=%d total=%d latency=%.2fs"
                and isinstance(record.args, tuple) and len(record.args) == 7 and safe_nonce):
            ordinal, model, provider, input_tokens, output_tokens, total_tokens, latency = record.args
            if (isinstance(ordinal, int) and isinstance(model, str) and isinstance(provider, str)
                    and all(isinstance(value, int) and value > 0 for value in (input_tokens, output_tokens, total_tokens))
                    and total_tokens == input_tokens + output_tokens and isinstance(latency, (int, float)) and latency > 0):
                receipt = json.dumps({"provider": provider, "model": model, "runtime": "hermes-native-tui", "input_tokens": input_tokens, "output_tokens": output_tokens, "total_tokens": total_tokens, "latency_seconds": latency}, separators=(",", ":")).encode()
                self.control("RUNTIME_RECEIPT", nonce, base64.urlsafe_b64encode(receipt).decode())

logging.getLogger("run_agent").addHandler(QuantFlowFailureHandler())
