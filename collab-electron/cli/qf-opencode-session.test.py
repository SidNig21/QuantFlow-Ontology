"""Offline falsifiers for the seat-local Hermes provider override."""

import os
import logging
from pathlib import Path
import runpy
import sys
from dataclasses import dataclass, field
from types import ModuleType
import unittest
import base64
import json
from unittest.mock import patch


@dataclass
class Profile:
    name: str = "opencode-go"
    aliases: tuple = ("go",)
    base_url: str = "https://opencode.ai/zen/go/v1"
    default_aux_model: str = "glm-5"
    default_headers: dict = field(default_factory=lambda: {"existing": "preserved"})


class SessionHeaderTests(unittest.TestCase):
    def load(self, identity):
        original = Profile()
        registered = []
        registry = ModuleType("providers")
        registry.get_provider_profile = lambda name: original if name == original.name else None
        registry.register_provider = registered.append
        with patch.dict(sys.modules, {"providers": registry}), patch.dict(os.environ, {}, clear=True):
            if identity is not None:
                os.environ["QF_AGENT_SESSION_ID"] = identity
            self.module = runpy.run_path(str(Path(__file__).parent / "qf-opencode-session" / "__init__.py"))
        return original, registered[0]

    def test_missing_empty_and_header_injection_refuse(self):
        for identity in (None, "", " ", "seat\r\ninjected: value", "../seat"):
            with self.subTest(identity=identity), self.assertRaises(RuntimeError):
                self.load(identity)

    def test_distinct_participants_preserve_provider_and_existing_headers(self):
        for identity in ("worker-39bd", "critic-721e"):
            original, actual = self.load(identity)
            self.assertEqual(actual.default_headers, {"existing": "preserved", "x-opencode-session": identity})
            self.assertEqual(original.default_headers, {"existing": "preserved"})
            for name in ("name", "aliases", "base_url", "default_aux_model"):
                self.assertEqual(getattr(actual, name), getattr(original, name))

    def test_only_terminal_runtime_record_emits_safe_failure(self):
        self.load("worker-failure-test")
        handler = self.module["QuantFlowFailureHandler"]()
        message = "Streaming failed after partial delivery, not retrying: %s"
        with patch.dict(os.environ, {"QF_RUNTIME_FAILURE_NONCE": "failure-test"}), patch("os.write") as write:
            for logger, text in (("tool", message), ("run_agent", "Retrying API call in %ss"), ("run_agent", "%s")):
                handler.emit(logging.LogRecord(logger, logging.WARNING, "run_agent.py", 1, text, ("private error detail",), None))
            write.assert_not_called()
            handler.emit(logging.LogRecord("run_agent", logging.WARNING, "run_agent.py", 1, message, ("private error detail",), None))
            write.assert_called_once_with(1, b"\x1b]777;QF;STREAM_FAILURE;failure-test;\x07")

    def test_429_stops_before_retry_without_leaking_exception(self):
        self.load("worker-rate-test")
        handler = self.module["QuantFlowFailureHandler"]()
        error = type("RateLimit", (), {"status_code": 429, "__str__": lambda self: "secret URL and token"})()
        with patch.dict(os.environ, {"QF_RUNTIME_FAILURE_NONCE": "rate-test"}), patch("os.write") as write:
            handler.emit(logging.LogRecord("run_agent", logging.INFO, "run_agent.py", 1, "Streaming failed before delivery: %s", (error,), None))
            handler.emit(logging.LogRecord("run_agent", logging.WARNING, "run_agent.py", 1, "Retrying API call in %ss", (120,), None))
            write.assert_called_once_with(1, b"\x1b]777;QF;PROVIDER_UNAVAILABLE;rate-test;\x07")
            self.assertNotIn(b"secret", write.call_args.args[1])

    def test_success_emits_only_credential_safe_structured_receipt(self):
        self.load("worker-receipt-test")
        handler = self.module["QuantFlowFailureHandler"]()
        with patch.dict(os.environ, {"QF_RUNTIME_FAILURE_NONCE": "receipt-test"}), patch("os.write") as write:
            handler.emit(logging.LogRecord("run_agent", logging.INFO, "run_agent.py", 1, "API call #%d: model=%s provider=%s in=%d out=%d total=%d latency=%.2fs", (1, "model-current", "opencode-go", 10, 4, 14, 1.25), None))
            wire = write.call_args.args[1].decode()
            payload = wire.split(";", 4)[4][:-1]
            receipt = json.loads(base64.urlsafe_b64decode(payload))
            self.assertEqual(receipt, {"provider": "opencode-go", "model": "model-current", "runtime": "hermes-native-tui", "input_tokens": 10, "output_tokens": 4, "total_tokens": 14, "latency_seconds": 1.25})


if __name__ == "__main__":
    unittest.main()
