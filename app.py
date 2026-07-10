import os
import io
import json
import base64
import math
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
import requests as http_requests
import timm
import gc
try:
    import terratorch  # Triggers Prithvi model registration globally
except ImportError:
    pass  # Allow graceful degradation
from PIL import Image
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

import sys

# ─── Configuration ────────────────────────────────────────────────────────────
if getattr(sys, 'frozen', False):
    # Runs in a PyInstaller bundle (--onedir mode)
    BUNDLE_DIR = os.path.dirname(sys.executable)
    BASE_DIR = BUNDLE_DIR
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CLASS_NAMES = [
    "AnnualCrop",
    "Forest",
    "HerbaceousVegetation",
    "Highway",
    "Industrial",
    "Pasture",
    "PermanentCrop",
    "Residential",
    "River",
    "SeaLake",
]

# Human-friendly labels and descriptions for each class
CLASS_META = {
    "AnnualCrop":            {"label": "Annual Crop",             "icon": "agriculture",     "color": "#fbbf24", "desc": "Seasonal farming fields with crop rotation patterns"},
    "Forest":                {"label": "Forest",                  "icon": "forest",          "color": "#10b981", "desc": "Dense tree canopy with high vegetation index"},
    "HerbaceousVegetation":  {"label": "Herbaceous Vegetation",   "icon": "grass",           "color": "#84cc16", "desc": "Wild grassland or bushy terrain coverage"},
    "Highway":               {"label": "Highway",                 "icon": "road",            "color": "#6b7280", "desc": "Paved road infrastructure and transport corridors"},
    "Industrial":            {"label": "Industrial",              "icon": "factory",         "color": "#94a3b8", "desc": "Factories, warehouses, and commercial structures"},
    "Pasture":               {"label": "Pasture",                 "icon": "landscape",       "color": "#a3e635", "desc": "Open grazing land and meadow terrain"},
    "PermanentCrop":         {"label": "Permanent Crop",          "icon": "eco",             "color": "#f59e0b", "desc": "Vineyards, orchards, and long-term plantations"},
    "Residential":           {"label": "Residential",             "icon": "home",            "color": "#f97316", "desc": "Urban housing and neighborhood developments"},
    "River":                 {"label": "River",                   "icon": "water",           "color": "#3b82f6", "desc": "Natural flowing water bodies and waterways"},
    "SeaLake":               {"label": "Sea / Lake",              "icon": "waves",           "color": "#0ea5e9", "desc": "Oceans, lakes, and large stationary water bodies"},
}

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ─── Model Architectures ──────────────────────────────────────────────────────

class SwinClassifier(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        # Using swin_base_patch4_window7_224 as per training notebook
        self.backbone = timm.create_model('swin_base_patch4_window7_224', pretrained=False, num_classes=0)
        feature_dim = 1024 # swin_base hidden dim
        self.classifier = nn.Sequential(
            nn.LayerNorm(feature_dim),
            nn.Dropout(0.3),
            nn.Linear(feature_dim, 512),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes),
        )

    def forward(self, x):
        features = self.backbone(x)
        return self.classifier(features)

class PrithviClassifier(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.backbone = timm.create_model('prithvi_swin_B', pretrained=False, num_classes=0, features_only=True)
        self.channel_adapter = nn.Conv2d(3, 6, kernel_size=1, bias=False)
        feature_dims = self.backbone.feature_info.channels()
        feature_dim = feature_dims[-1]
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.classifier = nn.Sequential(
            nn.LayerNorm(feature_dim),
            nn.Dropout(0.3),
            nn.Linear(feature_dim, 512),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes),
        )

    def forward(self, x):
        x = self.channel_adapter(x)
        features = self.backbone(x)
        x = features[-1]
        if x.ndim == 4 and x.shape[-1] != x.shape[-2]:
            x = x.permute(0, 3, 1, 2).contiguous()
        x = self.pool(x).flatten(1)
        return self.classifier(x)

class ModelManager:
    def __init__(self):
        self.models = {}
        self.configs = {
            "resnet50": {
                "id": "resnet50",
                "name": "ResNet50 (Transfer Learning)",
                "path": os.path.join(BASE_DIR, "Models", "best_model.pth"),
                "input_size": (64, 64),
                "accuracy": "98.25%",
                "type": "resnet",
                "desc": "Balanced performance and speed. RGB 64px input."
            },
            "swin": {
                "id": "swin",
                "name": "Swin Transformer",
                "path": os.path.join(BASE_DIR, "Models", "swin_best_model.pth"),
                "input_size": (224, 224),
                "accuracy": "98.42%",
                "type": "swin",
                "desc": "Hierarchical Vision Transformer using shifted windows. RGB 224px input."
            },
            "prithvi": {
                "id": "prithvi",
                "name": "Prithvi-EO 2.0 Foundation",
                "path": os.path.join(BASE_DIR, "Models", "prithvi_best_model.pth"),
                "input_size": (224, 224),
                "accuracy": "91.23%",
                "type": "prithvi",
                "desc": "IBM/NASA foundation model fine-tuned on EuroSAT with channel synthesis."
            }
        }

    def _build_resnet(self):
        model = models.resnet50(weights=None)
        in_features = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.Dropout(p=0.3),
            nn.Linear(256, len(CLASS_NAMES)),
        )
        return model

    def get_model(self, model_id):
        if model_id not in self.configs:
            model_id = "resnet50"
            
        if model_id not in self.models:
            config = self.configs[model_id]
            print(f"[INFO] Loading model: {config['name']}...")
            
            if config["type"] == "resnet":
                model = self._build_resnet()
            elif config["type"] == "prithvi":
                model = PrithviClassifier(num_classes=len(CLASS_NAMES))
            else:
                model = SwinClassifier(num_classes=len(CLASS_NAMES))
                
            state = torch.load(config["path"], map_location=DEVICE, weights_only=True)
            # Handle both state_dict and full checkpoint formats
            if isinstance(state, dict) and "model_state_dict" in state:
                model.load_state_dict(state["model_state_dict"])
            else:
                model.load_state_dict(state)
                
            model.to(DEVICE)
            model.eval()
            
            # Dynamic Quantization or FP16 Compression
            if DEVICE.type == "cpu":
                print(f"[INFO] Applying int8 Dynamic Quantization to {config['name']}...")
                model = torch.quantization.quantize_dynamic(
                    model, {nn.Linear}, dtype=torch.qint8
                )
            else:
                print(f"[INFO] Applying FP16 Half-Precision to {config['name']} on CUDA...")
                model = model.half()
            
            # To prevent OOM, we ensure only one model is loaded at a time in deployment
            if self.models:
                self.models.clear()
                gc.collect()
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                    
            self.models[model_id] = model
            print(f"[OK] {config['name']} loaded successfully.")
            
        return self.models[model_id], self.configs[model_id]

    def get_transform(self, input_size):
        return transforms.Compose([
            transforms.Resize(input_size),
            transforms.ToTensor(),
            transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5]),
        ])

model_manager = ModelManager()

# ─── Resolve Frontend paths ───────────────────────────────────────────────────
if getattr(sys, 'frozen', False):
    FRONTEND_DIR = os.path.join(BASE_DIR, "Frontend")
else:
    FRONTEND_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "..", "Frontend"))

# ─── Flask App ────────────────────────────────────────────────────────────────
app = Flask(__name__,
            static_folder=os.path.join(FRONTEND_DIR, "static"),
            static_url_path="/static")
CORS(app)


@app.route("/")
def index():
    """Serve the landing page."""
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/classify")
def classify_page():
    """Serve the classification observatory page."""
    return send_from_directory(os.path.join(FRONTEND_DIR, "classify"), "index.html")


@app.route("/manifest.json")
def manifest():
    """Serve the PWA manifest."""
    return send_from_directory(FRONTEND_DIR, "manifest.json")


@app.route("/service-worker.js")
def service_worker():
    """Serve the PWA service worker."""
    return send_from_directory(FRONTEND_DIR, "service-worker.js")


@app.route("/health")
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "service": "GlobeClass AI Classification API"})


@app.route("/api/classify", methods=["POST"])
def classify():
    try:
        # --- Get image bytes ---
        if "image" in request.files:
            file = request.files["image"]
            img_bytes = file.read()
        elif request.is_json and "image_base64" in request.json:
            img_bytes = base64.b64decode(request.json["image_base64"])
        else:
            return jsonify({"error": "No image provided."}), 400

        # --- Get requested model ---
        model_id = request.form.get("model", request.json.get("model", "resnet50") if request.is_json else "resnet50")
        model, config = model_manager.get_model(model_id)
        transform = model_manager.get_transform(config["input_size"])

        # --- Preprocess ---
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        tensor = transform(image).unsqueeze(0).to(DEVICE)
        
        # Match model precision on GPU
        if DEVICE.type == "cuda":
            tensor = tensor.half()

        # --- Inference ---
        with torch.no_grad():
            outputs = model(tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]

        # --- Build response ---
        results = []
        for idx, class_name in enumerate(CLASS_NAMES):
            meta = CLASS_META[class_name]
            results.append({
                "class_id":    class_name,
                "label":       meta["label"],
                "icon":        meta["icon"],
                "color":       meta["color"],
                "description": meta["desc"],
                "confidence":  round(probabilities[idx].item() * 100, 2),
            })

        results.sort(key=lambda x: x["confidence"], reverse=True)

        return jsonify({
            "success":    True,
            "prediction": results[0]["label"],
            "confidence": results[0]["confidence"],
            "results":    results,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/model-info", methods=["GET"])
def model_info():
    """Return info for all available models."""
    return jsonify({
        "models": list(model_manager.configs.values()),
        "device": str(DEVICE),
        "num_classes": len(CLASS_NAMES),
        "classes": [CLASS_META[c]["label"] for c in CLASS_NAMES]
    })


@app.route("/api/sample-images", methods=["GET"])
def sample_images():
    """Return paths to sample test images."""
    samples = []
    test_dir = os.path.join(BASE_DIR, "..", "Data EuroSAT_split_data_TVT", "Test")
    if os.path.exists(test_dir):
        for class_name in CLASS_NAMES:
            class_dir = os.path.join(test_dir, class_name)
            if os.path.isdir(class_dir):
                files = [f for f in os.listdir(class_dir) if f.lower().endswith((".jpg", ".png"))]
                if files:
                    img_path = os.path.join(class_dir, files[0])
                    with open(img_path, "rb") as f:
                        b64 = base64.b64encode(f.read()).decode("utf-8")
                    samples.append({
                        "class": class_name,
                        "label": CLASS_META[class_name]["label"],
                        "base64": f"data:image/jpeg;base64,{b64}",
                    })
    return jsonify({"samples": samples})


@app.route("/api/satellite-capture", methods=["GET"])
def satellite_capture():
    try:
        lat = float(request.args.get("lat", 30.0))
        lon = float(request.args.get("lon", 31.0))
        zoom = int(request.args.get("zoom", 14))

        zoom = max(10, min(18, zoom))
        span = 0.05 / (2 ** (zoom - 14))
        west = lon - span
        east = lon + span
        south = lat - span
        north = lat + span

        url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export"
        params = {
            "bbox": f"{west},{south},{east},{north}",
            "bboxSR": "4326",
            "imageSR": "4326",
            "size": "512,512",
            "format": "png",
            "f": "image",
        }

        resp = http_requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        b64 = base64.b64encode(resp.content).decode("utf-8")

        return jsonify({
            "success": True,
            "image_base64": f"data:image/png;base64,{b64}",
            "lat": lat,
            "lon": lon,
            "zoom": zoom
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
