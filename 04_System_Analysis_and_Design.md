# System Analysis & Design
# تحليل وتصميم النظام

## GlobeClass — AI-Powered Satellite Image Land Cover Classification

---

## 1. System Architecture

GlobeClass follows a **client-server architecture** with a clear separation between the frontend (presentation layer) and backend (application + ML inference layer).

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  Landing Page │  │  Observatory │  │  Service Worker (PWA) │ │
│  │  (index.html) │  │  (classify/) │  │                       │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────────────────┘ │
│         │                 │                                     │
│  ┌──────▼─────────────────▼──────────────────────────────────┐ │
│  │              Shared JavaScript Modules                     │ │
│  │  i18n.js │ globe.js │ app.js │ models-carousel.js │ etc.  │ │
│  └──────────────────────┬────────────────────────────────────┘ │
│                         │  HTTP / Fetch API                     │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SERVER (Flask on Railway)                      │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Flask REST API (app.py)                  │ │
│  │                                                            │ │
│  │  Routes:                                                   │ │
│  │  GET  /                    → Landing page                  │ │
│  │  GET  /classify            → Observatory page              │ │
│  │  GET  /health              → Health check                  │ │
│  │  GET  /api/model-info      → Model metadata                │ │
│  │  GET  /api/sample-images   → Test sample images            │ │
│  │  GET  /api/satellite-capture → Live satellite fetch        │ │
│  │  POST /api/classify        → Image classification          │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                             │
│  ┌────────────────▼───────────────────────────────────────────┐ │
│  │              ModelManager (Multi-Model Engine)              │ │
│  │                                                            │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌───────────────────┐  │ │
│  │  │  ResNet50   │  │    Swin-B    │  │   Prithvi-EO 2.0  │  │ │
│  │  │  98.25%     │  │   98.42%     │  │    91.23%          │  │ │
│  │  │  64×64 RGB  │  │  224×224 RGB │  │   224×224 RGB→6ch  │  │ │
│  │  │  24M params │  │  88M params  │  │   87M params       │  │ │
│  │  └────────────┘  └──────────────┘  └───────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Optimization: INT8 Quantization (CPU) / FP16 (GPU)        │ │
│  │  Memory: Single-model loading with GC                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌────────┐ ┌──────────┐
        │ ESRI API │ │Nominatim│ │Model .pth│
        │(Sat Imgs)│ │(Geocode)│ │  Files   │
        └──────────┘ └────────┘ └──────────┘
```

---

## 2. Component Diagram

```
┌─────────────────────────────────────────────────┐
│                  Frontend Components             │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────┐    ┌────────────────────────┐  │
│  │   i18n.js   │    │    globe.js            │  │
│  │  EN/AR      │    │  Three.js 3D Earth     │  │
│  │  switching   │    │  Zoom/Rotate/Click     │  │
│  └─────────────┘    └────────────────────────┘  │
│                                                 │
│  ┌─────────────────────────────────────────────┐│
│  │               app.js                        ││
│  │  - File upload & preview                    ││
│  │  - Satellite capture flow                   ││
│  │  - Classification API calls                 ││
│  │  - Results display & Chart.js               ││
│  │  - History management                       ││
│  │  - Leaflet map initialization               ││
│  │  - Mobile toolbar & search                  ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  ┌──────────────────┐  ┌──────────────────────┐ │
│  │models-carousel.js│  │  legacy-tabs.js      │ │
│  │ Landing card     │  │  Model stats section │ │
│  │ carousel         │  │  tab switching       │ │
│  └──────────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                  Backend Components              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────────┐│
│  │           ModelManager (Singleton)           ││
│  │  - configs{} : model metadata               ││
│  │  - models{}  : loaded model instances       ││
│  │  - get_model(id) : lazy load + quantize     ││
│  │  - get_transform(size) : preprocessing      ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  ┌──────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ ResNet50 │ │SwinClassifier│ │PrithviClass.│ │
│  │ (torchv.)│ │  (timm)      │ │(terratorch) │ │
│  └──────────┘ └──────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 3. Class Diagram (Backend)

```
┌───────────────────────────────────────┐
│           ModelManager                 │
├───────────────────────────────────────┤
│ - models: dict                        │
│ - configs: dict                       │
├───────────────────────────────────────┤
│ + __init__()                          │
│ + get_model(model_id) → (model, cfg)  │
│ + get_transform(input_size) → Compose │
│ - _build_resnet() → nn.Module         │
└───────────┬───────────────────────────┘
            │ manages
            ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│    ResNet50      │  │  SwinClassifier  │  │  PrithviClassifier   │
│  (torchvision)   │  │   (nn.Module)    │  │    (nn.Module)       │
├──────────────────┤  ├──────────────────┤  ├──────────────────────┤
│ - backbone       │  │ - backbone       │  │ - backbone           │
│ - fc (custom)    │  │ - classifier     │  │ - channel_adapter    │
│   Dropout(0.4)   │  │   LayerNorm      │  │   Conv2d(3→6)       │
│   Linear→256     │  │   Dropout(0.3)   │  │ - pool               │
│   ReLU           │  │   Linear→512     │  │ - classifier         │
│   Dropout(0.3)   │  │   GELU           │  │   LayerNorm          │
│   Linear→10      │  │   Dropout(0.2)   │  │   Dropout(0.3)       │
├──────────────────┤  │   Linear→10      │  │   Linear→512         │
│ + forward(x)     │  ├──────────────────┤  │   GELU               │
└──────────────────┘  │ + forward(x)     │  │   Dropout(0.2)       │
                      └──────────────────┘  │   Linear→10          │
                                            ├──────────────────────┤
                                            │ + forward(x)         │
                                            │   x→adapter→backbone │
                                            │   →pool→classifier   │
                                            └──────────────────────┘
```

---

## 4. Sequence Diagram — Image Classification Flow

```
User          Frontend(app.js)      Flask API        ModelManager       Model
 │                 │                    │                  │               │
 │ Upload image    │                    │                  │               │
 │────────────────►│                    │                  │               │
 │                 │ POST /api/classify │                  │               │
 │                 │───────────────────►│                  │               │
 │                 │                    │ get_model(id)    │               │
 │                 │                    │─────────────────►│               │
 │                 │                    │                  │ Load weights  │
 │                 │                    │                  │──────────────►│
 │                 │                    │                  │ Quantize(INT8)│
 │                 │                    │                  │──────────────►│
 │                 │                    │  model, config   │               │
 │                 │                    │◄─────────────────│               │
 │                 │                    │                  │               │
 │                 │                    │ Preprocess image │               │
 │                 │                    │ (resize, norm)   │               │
 │                 │                    │                  │               │
 │                 │                    │ model(tensor)    │               │
 │                 │                    │─────────────────────────────────►│
 │                 │                    │ softmax probs    │               │
 │                 │                    │◄─────────────────────────────────│
 │                 │                    │                  │               │
 │                 │  JSON response     │                  │               │
 │                 │  {prediction,      │                  │               │
 │                 │   confidence,      │                  │               │
 │                 │   results[10]}     │                  │               │
 │                 │◄───────────────────│                  │               │
 │ Display results │                    │                  │               │
 │◄────────────────│                    │                  │               │
```

---

## 5. Data Flow Diagram

```
                    ┌───────────────┐
                    │   User Input  │
                    │ (Image/Coords)│
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              ▼                           ▼
    ┌──────────────────┐       ┌──────────────────┐
    │  Upload Image    │       │  Satellite Capture│
    │  (File/Drag&Drop)│       │  (ESRI API)       │
    └────────┬─────────┘       └────────┬──────────┘
             │                          │
             └──────────┬───────────────┘
                        ▼
              ┌──────────────────┐
              │  Image Bytes     │
              │  (RGB, JPG/PNG)  │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │  Preprocessing   │
              │  Resize → Tensor │
              │  Normalize       │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │  Neural Network  │
              │  Inference       │
              │  (Selected Model)│
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │  Softmax Output  │
              │  10 Probabilities│
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │  JSON Response   │
              │  Sorted by conf. │
              └────────┬─────────┘
                       ▼
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ Result   │  │ Breakdown│  │ Chart.js │
   │ Card     │  │ List     │  │ Bar Chart│
   └──────────┘  └──────────┘  └──────────┘
```

---

## 6. Database Design

> **Note:** GlobeClass does not use a traditional relational database. All data is either file-based (model weights, images) or session-based (classification history in browser memory). This section documents the data structures used.

### 6.1 Model Configuration (In-Memory Dictionary)

| Field | Type | Example |
|-------|------|---------|
| id | string | "resnet50" |
| name | string | "ResNet50 (Transfer Learning)" |
| path | string | "Models/best_model.pth" |
| input_size | tuple(int,int) | (64, 64) |
| accuracy | string | "98.25%" |
| type | string | "resnet" |
| desc | string | "Balanced performance and speed." |

### 6.2 Classification Result (JSON Response)

| Field | Type | Example |
|-------|------|---------|
| success | boolean | true |
| prediction | string | "Forest" |
| confidence | float | 97.82 |
| results | array[10] | [{class_id, label, icon, color, description, confidence}] |

### 6.3 Class Metadata (Static Dictionary)

| Field | Type | Example |
|-------|------|---------|
| label | string | "Forest" |
| icon | string | "forest" |
| color | string | "#10b981" |
| desc | string | "Dense tree canopy with high vegetation index" |

### 6.4 File-Based Storage

| Data | Location | Format |
|------|----------|--------|
| ResNet50 weights | Models/best_model.pth | PyTorch state_dict (~92 MB) |
| Swin-B weights | Models/swin_best_model.pth | PyTorch state_dict (~333 MB) |
| Prithvi-EO weights | Models/prithvi_best_model.pth | PyTorch state_dict (~334 MB) |
| Training data | Data EuroSAT_split_data_TVT/ | 27K images in class folders |
| Raw dataset | Data/ EuroSAT RGB dataset/ | Original unsplit dataset |

---

## 7. Technology Stack

| Layer | Technology | Version/Details | Justification |
|-------|-----------|-----------------|---------------|
| **ML Framework** | PyTorch | 2.3.1+ (CPU) | Industry standard; native support for all 3 model architectures |
| **Model Library** | timm | 0.9.16 | Provides 700+ pre-trained architectures including Swin Transformer |
| **Foundation Model** | terratorch | Latest | IBM's library for Prithvi-EO model registration |
| **Backend** | Flask | 3.0.3 | Lightweight, easy REST API development |
| **CORS** | Flask-CORS | 4.0.1 | Cross-origin request handling for frontend-backend communication |
| **Server** | Gunicorn | 22.0.0 | Production WSGI server with timeout configuration |
| **Image Processing** | Pillow | 10.4.0 | Image loading and format conversion |
| **HTTP Client** | requests | 2.32.3 | ESRI satellite image fetching |
| **3D Rendering** | Three.js | 0.160.0 | WebGL 3D Earth globe with textures |
| **Mapping** | Leaflet.js | 1.9.4 | Interactive satellite map with ESRI tiles |
| **Charts** | Chart.js | 4.4.4 | Confidence distribution visualization |
| **CSS Framework** | Tailwind CSS | CDN (latest) | Rapid responsive UI development |
| **Fonts** | Inter, Manrope | Google Fonts | Modern typography |
| **Icons** | Material Symbols | Google | Consistent icon system |
| **Deployment** | Railway | Cloud PaaS | Automatic builds from Git, Procfile-based |
| **VCS** | Git / GitHub | - | Source control and collaboration |

---

## 8. Interface Design

### 8.1 Landing Page Layout

```
┌──────────────────────────────────────────────────┐
│  NAV: [GlobeClass] [Explore] [Observatory] [Lab] │
├──────────────────────────────────────────────────┤
│                                                  │
│            ★ HERO SECTION ★                      │
│         "Behold the Infinite."                   │
│     AI satellite classification tagline          │
│         [ 3D Globe Animation ]                   │
│   [Launch Classification] [How It Works]         │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│     ★ NEURAL ARCHITECTURES CAROUSEL ★            │
│   [Left Info Panel]  [Interactive Card Stack]    │
│    27k+ dataset       Model details card         │
│    Stats              with navigation dots       │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│         ★ HOW IT WORKS (3 Steps) ★               │
│   [Upload Image] [Neural Class.] [Results]       │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│       ★ 10 LAND COVER CLASSES GRID ★             │
│   [AnnualCrop][Forest][Herbaceous][Highway]...   │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│          ★ MODEL STATS SECTION ★                 │
│   [Description + Stats]  [Architecture Card]     │
│    98.25% / 24M / 27K    [ResNet|Swin|Prithvi]   │
│                                                  │
├──────────────────────────────────────────────────┤
│  FOOTER: [Observatory] [How It Works] [Classes]  │
└──────────────────────────────────────────────────┘
```

### 8.2 Observatory (Classification) Page Layout

```
┌──────────────────────────────────────────────────┐
│  NAV: [GlobeClass] [Explore] [Observatory] [●AI] │
├──────────┬───────────────────────────────────────┤
│          │                                       │
│ SIDEBAR  │        MAIN VIEWPORT (8 cols)         │
│ (hidden  │  ┌─────────────────────────────────┐  │
│  mobile) │  │                                 │  │
│          │  │   3D Globe / Satellite Map       │  │
│ [HUD]    │  │   with coordinate overlay        │  │
│ [Search] │  │   and zoom controls              │  │
│ [Coords] │  │                                 │  │
│          │  └─────────────────────────────────┘  │
│ ──────── │  ┌─────────────────────────────────┐  │
│ [HUD]    │  │  Upload Zone (drag & drop)      │  │
│ [Upload] │  └─────────────────────────────────┘  │
│ [Gallery]│                                       │
│          │        RESULTS PANEL (4 cols)          │
│ ──────── │  ┌──────────────────────────────┐     │
│ Model:   │  │ Captured Image Preview       │     │
│ [Select] │  │ Primary Result Card          │     │
│ ResNet50 │  │ Full Breakdown (10 classes)  │     │
│ 98.25%   │  │ Confidence Chart             │     │
│          │  │ Classification History Log   │     │
│          │  │ Sample Gallery               │     │
│          │  └──────────────────────────────┘     │
├──────────┴───────────────────────────────────────┤
│  FOOTER: © 2026  | Model | 10cl │
└──────────────────────────────────────────────────┘
```

---

## 9. Model Architecture Details

### 9.1 ResNet50 (Transfer Learning)

| Property | Value |
|----------|-------|
| Base Architecture | ResNet50 (ImageNet pre-trained) |
| Input Size | 64 × 64 × 3 (RGB) |
| Total Parameters | ~24 Million |
| Training Strategy | Phase 1: Backbone frozen (feature extraction) → Phase 2: Full fine-tuning |
| Custom Head | Dropout(0.4) → Linear(2048, 256) → ReLU → Dropout(0.3) → Linear(256, 10) |
| Test Accuracy | **98.25%** |

### 9.2 Swin Transformer (Base)

| Property | Value |
|----------|-------|
| Base Architecture | swin_base_patch4_window7_224 |
| Input Size | 224 × 224 × 3 (RGB) |
| Total Parameters | ~88 Million |
| Training Strategy | Shifted-window self-attention, hierarchical patch merging |
| Custom Head | LayerNorm(1024) → Dropout(0.3) → Linear(1024, 512) → GELU → Dropout(0.2) → Linear(512, 10) |
| Test Accuracy | **98.42%** |

### 9.3 Prithvi-EO 2.0 Foundation Model

| Property | Value |
|----------|-------|
| Base Architecture | Prithvi Swin-B (IBM/NASA) |
| Input Size | 224 × 224 × 3 (RGB → 6-band via Conv2d adapter) |
| Total Parameters | ~87 Million |
| Training Strategy | MAE self-supervised pre-training → full fine-tuning on EuroSAT |
| Channel Adapter | Conv2d(3, 6, kernel_size=1) — projects RGB to 6-band HLS-like input |
| Custom Head | AdaptiveAvgPool2d(1) → LayerNorm → Dropout(0.3) → Linear(dim, 512) → GELU → Dropout(0.2) → Linear(512, 10) |
| Test Accuracy | **91.23%** |

---

## 10. Deployment Architecture

```
┌───────────────┐     HTTPS      ┌───────────────────────┐
│   User's      │◄──────────────►│   Railway (Cloud)     │
│   Browser     │                │                       │
│               │                │  Gunicorn + Flask     │
│  - HTML/CSS/JS│                │  -w 1 --timeout 120   │
│  - Three.js   │                │                       │
│  - Leaflet    │                │  Models/ (.pth files) │
│  - Chart.js   │                │  Frontend/ (static)   │
└───────────────┘                └───────────┬───────────┘
                                             │
                                    ┌────────┼────────┐
                                    ▼        ▼        ▼
                              ┌────────┐┌────────┐┌────────┐
                              │ ESRI   ││Nominat.││ GitHub │
                              │ ArcGIS ││(OSM)   ││ (LFS)  │
                              │ Tiles  ││Geocode ││ Models │
                              └────────┘└────────┘└────────┘
```

### Deployment Configuration

| Component | Configuration |
|-----------|--------------|
| **Procfile** | `web: gunicorn -w 1 -b 0.0.0.0:$PORT app:app --timeout 120` |
| **Python** | 3.10 (Railway default) |
| **PyTorch** | CPU-only wheels (linux_x86_64) |
| **Model Loading** | Lazy loading with single-model memory policy |
| **Optimization** | INT8 dynamic quantization on CPU |

---

## 11. Project Directory Structure

```
GlobeClass/
├── Frontend/                          # Client-side web application
│   ├── index.html                     # Landing page (567 lines)
│   ├── classify/
│   │   └── index.html                 # Observatory/classification page (539 lines)
│   ├── manifest.json                  # PWA manifest
│   ├── service-worker.js              # PWA caching service worker
│   └── static/
│       ├── css/
│       │   └── style.css              # Custom styles + responsive breakpoints
│       ├── js/
│       │   ├── app.js                 # Main application logic (948 lines)
│       │   ├── globe.js               # Three.js 3D Earth globe (278 lines)
│       │   ├── i18n.js                # EN/AR internationalization (242 lines)
│       │   ├── models-carousel.js     # Architecture card carousel
│       │   └── legacy-tabs.js         # Model stats tab switcher
│       └── images/
│           ├── app-icon.png           # PWA app icon
│           └── prithvi_satellite.png  # Prithvi card image
│
├── Notebooks/
│   ├── notebook milestone_1_2.ipynb   # Training notebook (EDA + all models)
│   └── prithvi_model.py              # Prithvi-EO training script (375 lines)
│
├── Models/                            # Trained model weights
│   ├── best_model.pth                 # ResNet50 (~92 MB)
│   ├── swin_best_model.pth            # Swin Transformer (~333 MB)
│   └── prithvi_best_model.pth         # Prithvi-EO (~334 MB)
│
├── Data/
│   └── EuroSAT RGB dataset/           # Original dataset (10 class folders)
│
├── Data EuroSAT_split_data_TVT/       # Split dataset
│   ├── Train/                         # Training images (10 class folders)
│   ├── Valid/                         # Validation images
│   └── Test/                          # Test images
│
├── deployment/
│   └── railway_backend/
│       ├── app.py                     # Flask API server (382 lines)
│       ├── requirements.txt           # Python dependencies
│       ├── Procfile                   # Gunicorn configuration
│       └── Models/                    # Deployed model weights
│
├── GlobeClass_models/                 # Separate model repository
│   ├── LICENSE                        # MIT License
│   └── Models/                        # Model weight files
│
├── requirements.txt                   # Root project dependencies
├── APP_logo.png                       # Application logo
└── docs/                              # Project documentation
    ├── 01_Project_Planning_and_Management.md
    ├── 02_Literature_Review.md
    ├── 03_Requirements_Gathering.md
    └── 04_System_Analysis_and_Design.md
```

---

*DEPI Program, 2026*
