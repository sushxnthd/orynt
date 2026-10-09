import os, time, datetime as dt, threading, yaml, requests, cv2
from ultralytics import YOLO

ALLOWED = {"crowding", "after_hours_occupancy", "restricted_zone_entry", "possible_fall", "camera_outage"}

def emit(base, token, camera, zone, event_type, confidence, metadata):
    if event_type not in ALLOWED:
        return
    payload = {
        "cameraExternalId": camera,
        "zone": zone,
        "eventType": event_type,
        "confidence": float(max(0, min(1, confidence))),
        "occurredAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "metadata": metadata,
    }
    requests.post(
        base.rstrip("/") + "/api/vision/edge/events",
        json=payload,
        headers={"x-orynt-edge-token": token},
        timeout=8,
    ).raise_for_status()

def outside_hours(now):
    return now.hour < 6 or now.hour >= 20

def run_camera(model, predict_lock, base, token, cfg, stride):
    url = os.environ[cfg["url_env"]]
    cap = cv2.VideoCapture(url)
    frame = 0
    last_event = {}
    outage_sent = False
    while True:
        ok, image = cap.read()
        if not ok:
            if not outage_sent:
                emit(base, token, cfg["id"], cfg["zone"], "camera_outage", 1.0, {"privacy": "no-face-recognition"})
                outage_sent = True
            time.sleep(2)
            cap.release()
            cap = cv2.VideoCapture(url)
            continue
        outage_sent = False
        frame += 1
        if frame % stride:
            continue
        # Ultralytics model objects are shared for memory efficiency; serialize inference
        # so multiple RTSP reader threads cannot race inside one model instance.
        with predict_lock:
            result = model.predict(image, classes=[0], verbose=False)[0]
        boxes = result.boxes.xyxy.cpu().numpy() if result.boxes is not None else []
        count = len(boxes)
        now = dt.datetime.now()
        candidates = []
        if count >= int(cfg.get("crowd_threshold", 15)):
            candidates.append(("crowding", min(1.0, count / max(1, int(cfg.get("crowd_threshold", 15)))), {"person_count": count}))
        if count and cfg.get("restricted", False):
            candidates.append(("restricted_zone_entry", .8, {"person_count": count}))
        if count and outside_hours(now):
            candidates.append(("after_hours_occupancy", .85, {"person_count": count}))
        for x1, y1, x2, y2 in boxes:
            width = max(1, x2 - x1)
            height = max(1, y2 - y1)
            if width / height > 1.35:
                candidates.append(("possible_fall", .55, {"basis": "bbox_orientation"}))
                break
        for kind, confidence, meta in candidates:
            if time.time() - last_event.get(kind, 0) < 30:
                continue
            emit(base, token, cfg["id"], cfg["zone"], kind, confidence, {**meta, "privacy": "ephemeral-person-detection", "identity_tracking": False})
            last_event[kind] = time.time()

def main():
    path = os.environ.get("ORYNT_EDGE_CONFIG", "config.yml")
    with open(path, "r", encoding="utf-8") as handle:
        cfg = yaml.safe_load(handle)
    token = os.environ[cfg.get("edge_token_env", "ORYNT_EDGE_TOKEN")]
    model = YOLO(cfg.get("model", "yolov8n.pt"))
    predict_lock = threading.Lock()
    threads = []
    for camera in cfg.get("cameras", []):
        worker = threading.Thread(
            target=run_camera,
            args=(model, predict_lock, cfg["orynt_url"], token, camera, int(cfg.get("frame_stride", 5))),
            daemon=True,
        )
        worker.start()
        threads.append(worker)
    while True:
        time.sleep(60)

if __name__ == "__main__":
    main()
