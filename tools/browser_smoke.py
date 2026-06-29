import json
import subprocess
import time
import urllib.request
from pathlib import Path

from websockets.sync.client import connect


ROOT = Path(__file__).resolve().parents[1]
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
PORT = 9331


def devtools_pages():
    with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list", timeout=2) as response:
        return json.load(response)


def send(ws, message_id, method, params=None):
    ws.send(json.dumps({"id": message_id, "method": method, "params": params or {}}))
    while True:
        response = json.loads(ws.recv(timeout=10))
        if response.get("id") == message_id:
            if "error" in response:
                raise RuntimeError(response["error"])
            return response.get("result", {})


def evaluate(ws, message_id, expression):
    result = send(ws, message_id, "Runtime.evaluate", {"expression": expression, "returnByValue": True})
    return result["result"].get("value")


def main():
    profile = ROOT.parent / "tmp" / "chrome-tripmate-cdp"
    process = subprocess.Popen(
        [
            str(CHROME),
            "--headless=new",
            "--disable-gpu",
            "--disable-crash-reporter",
            f"--remote-debugging-port={PORT}",
            f"--user-data-dir={profile}",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        pages = None
        for _ in range(30):
            try:
                pages = devtools_pages()
                if pages:
                    break
            except Exception:
                time.sleep(0.2)
        if not pages:
            raise RuntimeError("Chrome debugging endpoint did not start")

        page = next((item for item in pages if item.get("type") == "page"), pages[0])
        with connect(page["webSocketDebuggerUrl"], max_size=8_000_000) as ws:
            send(ws, 1, "Page.enable")
            send(ws, 2, "Runtime.enable")
            send(ws, 3, "Page.navigate", {"url": "http://127.0.0.1:8765/"})
            for attempt in range(30):
                ready = evaluate(ws, 40 + attempt, "document.querySelector('h1')?.textContent === 'Kyoto'")
                if ready:
                    break
                time.sleep(0.2)
            else:
                raise RuntimeError("TripMate page did not become ready")

            initial = json.loads(
                evaluate(
                    ws,
                    100,
                    "JSON.stringify({title:document.title,h1:document.querySelector('h1')?.textContent,activities:document.querySelectorAll('.activity-row').length,overflow:document.body.scrollWidth>document.documentElement.clientWidth})",
                )
            )
            assert initial == {
                "title": "TripMate AI | Plan with confidence",
                "h1": "Kyoto",
                "activities": 3,
                "overflow": False,
            }, initial

            evaluate(ws, 101, "TripMate.openModal()")
            modal = evaluate(ws, 102, "Boolean(document.querySelector('.planner-modal') && document.querySelector('input[name=destination]'))")
            assert modal is True

            evaluate(
                ws,
                103,
                "document.querySelector('input[name=destination]').value='Cappadocia'; document.querySelector('.planner-form').requestSubmit(); true",
            )
            time.sleep(2.3)
            generated = json.loads(
                evaluate(
                    ws,
                    104,
                    "JSON.stringify({h1:document.querySelector('h1')?.textContent,trips:document.querySelectorAll('.trip-list-item').length,activities:document.querySelectorAll('.activity-row').length})",
                )
            )
            assert generated["h1"] == "Cappadocia", generated
            assert generated["trips"] >= 2, generated
            assert generated["activities"] == 3, generated
            print({"initial": initial, "generated": generated})
    finally:
        process.terminate()
        process.wait(timeout=10)


if __name__ == "__main__":
    main()
