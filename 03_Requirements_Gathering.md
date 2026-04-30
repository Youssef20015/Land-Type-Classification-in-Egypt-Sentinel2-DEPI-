# Requirements Gathering
# جمع المتطلبات

## GlobeClass — AI-Powered Satellite Image Land Cover Classification

---

## 1. Functional Requirements

Functional requirements define the specific behaviors and features the system must provide.

### 1.1 Image Classification Engine

| ID | Requirement | Priority | Description |
|----|------------|----------|-------------|
| FR-01 | Image Upload | High | The system shall allow users to upload satellite images in JPG and PNG formats for classification. |
| FR-02 | Multi-Model Inference | High | The system shall support classification using three distinct neural network architectures: ResNet50, Swin Transformer, and Prithvi-EO 2.0. |
| FR-03 | Model Switching | High | The system shall allow users to switch between available models in real-time via a dropdown selector. |
| FR-04 | Classification Output | High | The system shall return the predicted land cover class, confidence score (%), and probability distribution across all 10 classes for every classification request. |
| FR-05 | Image Preprocessing | High | The system shall automatically resize uploaded images to the required input dimensions (64×64 for ResNet50, 224×224 for Swin and Prithvi) and normalize pixel values. |
| FR-06 | Drag-and-Drop Upload | Medium | The system shall support drag-and-drop file upload in addition to the standard file browser dialog. |
| FR-07 | Image Preview | Medium | The system shall display a preview of the uploaded image with filename and file size before classification. |

### 1.2 Live Satellite Capture

| ID | Requirement | Priority | Description |
|----|------------|----------|-------------|
| FR-08 | Interactive 3D Globe | High | The system shall render an interactive 3D Earth globe using Three.js with rotation, zoom, and coordinate tracking. |
| FR-09 | Satellite Map View | High | The system shall provide a satellite map view using Leaflet.js with ESRI World Imagery tiles for high-resolution navigation. |
| FR-10 | Globe-to-Satellite Transition | Medium | The system shall provide a smooth animated transition between the 3D globe view and the satellite map view. |
| FR-11 | Satellite Image Capture | High | The system shall capture a 512×512 pixel satellite image from the current map viewport using the ESRI ArcGIS REST API. |
| FR-12 | Capture & Classify | High | The system shall automatically classify a captured satellite image immediately after capture, displaying results in real-time. |
| FR-13 | Coordinate Input | Medium | The system shall allow users to manually enter latitude and longitude coordinates to navigate to a specific location. |
| FR-14 | Location Search | Medium | The system shall support searching for places by name (city, landmark, address) using the Nominatim geocoding API. |
| FR-15 | GPS Geolocation | Medium | The system shall support using the browser's geolocation API to navigate to the user's current location. |

### 1.3 Results & Visualization

| ID | Requirement | Priority | Description |
|----|------------|----------|-------------|
| FR-16 | Primary Result Display | High | The system shall display the top predicted class with its icon, label, description, and confidence percentage. |
| FR-17 | Full Breakdown | High | The system shall show a ranked list of all 10 classes with individual confidence bars and percentages. |
| FR-18 | Confidence Chart | Medium | The system shall render an interactive bar chart (Chart.js) visualizing the confidence distribution across all classes. |
| FR-19 | Classification History | Medium | The system shall maintain a session-based classification log showing previous results with timestamps. |
| FR-20 | Clear History | Low | The system shall allow users to clear the classification history log. |

### 1.4 User Interface & Experience

| ID | Requirement | Priority | Description |
|----|------------|----------|-------------|
| FR-21 | Landing Page | High | The system shall have a landing page showcasing the project overview, model architectures, workflow, and land cover classes. |
| FR-22 | Model Carousel | Medium | The landing page shall feature an interactive carousel displaying details for all three neural network architectures. |
| FR-23 | Bilingual Support | Medium | The system shall support English and Arabic language switching with persistent language preference (localStorage). |
| FR-24 | PWA Installation | Low | The system shall be installable as a Progressive Web App on supported browsers and devices. |
| FR-25 | Sample Gallery | Medium | The system shall provide a gallery of sample test images from the EuroSAT dataset for quick testing. |
| FR-26 | Model Info API | Low | The system shall expose an API endpoint (/api/model-info) returning metadata about all available models. |

---

## 2. Non-Functional Requirements

Non-functional requirements define quality attributes and constraints the system must satisfy.

| ID | Category | Requirement | Target |
|----|----------|-------------|--------|
| NFR-01 | **Performance** | Classification inference latency | < 50ms for ResNet50, < 100ms for Swin/Prithvi (CPU) |
| NFR-02 | **Performance** | API response time (end-to-end) | < 2 seconds including image preprocessing |
| NFR-03 | **Performance** | Frontend page load time | < 3 seconds on broadband connection |
| NFR-04 | **Accuracy** | ResNet50 test set accuracy | ≥ 95% (Achieved: 98.25%) |
| NFR-05 | **Accuracy** | Swin Transformer test set accuracy | ≥ 95% (Achieved: 98.42%) |
| NFR-06 | **Accuracy** | Prithvi-EO test set accuracy | ≥ 85% (Achieved: 91.23%) |
| NFR-07 | **Scalability** | Concurrent API requests | Support single-user inference with model hot-swapping |
| NFR-08 | **Usability** | Mobile responsiveness | Fully functional on devices ≥ 320px width |
| NFR-09 | **Usability** | Accessibility | Semantic HTML, proper heading hierarchy, descriptive alt texts |
| NFR-10 | **Security** | Input validation | Validate image MIME types, reject non-image uploads |
| NFR-11 | **Security** | CORS policy | Flask-CORS configured for authorized origins |
| NFR-12 | **Reliability** | Health check endpoint | /health endpoint returns status for monitoring |
| NFR-13 | **Maintainability** | Code organization | Modular architecture: separate frontend, backend, notebooks, models |
| NFR-14 | **Portability** | Cross-browser compatibility | Chrome, Firefox, Safari, Edge (latest versions) |
| NFR-15 | **Availability** | Service uptime | Railway deployment with automatic restarts |
| NFR-16 | **Memory Efficiency** | Model loading strategy | Load only one model at a time; GC previous model to prevent OOM |

---

## 3. User Requirements

### 3.1 User Personas

**Persona 1: Environmental Researcher**
- Wants to quickly classify satellite imagery for land cover mapping studies
- Needs high accuracy and detailed confidence breakdowns
- Values the ability to compare multiple model architectures

**Persona 2: Student / Learner**
- Wants to understand how deep learning works for satellite imagery
- Appreciates the interactive 3D globe and step-by-step workflow explanation
- Uses the sample gallery for quick experimentation

**Persona 3: General User / Curious Explorer**
- Wants to explore Earth and classify their local area
- Uses the GPS "My Location" feature and place search
- Appreciates the bilingual (EN/AR) interface and mobile PWA

### 3.2 User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| US-01 | User | Upload a satellite image and get its land cover classification | I can quickly identify terrain types |
| US-02 | User | Zoom into the 3D globe and transition to a satellite view | I can visually explore any location on Earth |
| US-03 | User | Capture a live satellite image from the map and classify it | I can classify any real-world location |
| US-04 | User | Switch between different AI models | I can compare classification results |
| US-05 | User | See confidence scores for all 10 classes | I can understand how certain the AI is |
| US-06 | User | Search for a city or landmark by name | I can quickly navigate to specific locations |
| US-07 | User | Use my GPS location | I can classify the land cover at my current position |
| US-08 | User | View sample images from the dataset | I can test the system without my own images |
| US-09 | User | Switch the interface language to Arabic | I can use the application in my preferred language |
| US-10 | User | Install the app on my phone | I can access it quickly like a native app |
| US-11 | User | View my classification history | I can compare past results |

---

## 4. Use Case Diagram

```
                    ┌──────────────────────────────────────────────┐
                    │              GlobeClass System                │
                    │                                              │
                    │  ┌──────────────────────────────────┐       │
                    │  │     Upload Satellite Image        │       │
                    │  └───────────────┬──────────────────┘       │
                    │                  │                            │
                    │  ┌───────────────▼──────────────────┐       │
        ┌───┐       │  │     Classify Image               │       │
        │   │       │  │  (Select Model: ResNet50 /       │       │
        │ U │──────►│  │   Swin / Prithvi)                │       │
        │ s │       │  └───────────────┬──────────────────┘       │
        │ e │       │                  │                            │
        │ r │       │  ┌───────────────▼──────────────────┐       │
        │   │       │  │     View Results & Breakdown      │       │
        │   │       │  └──────────────────────────────────┘       │
        │   │       │                                              │
        │   │       │  ┌──────────────────────────────────┐       │
        │   │──────►│  │     Explore 3D Globe              │       │
        │   │       │  └───────────────┬──────────────────┘       │
        │   │       │                  │                            │
        │   │       │  ┌───────────────▼──────────────────┐       │
        │   │──────►│  │     Open Satellite Map View       │       │
        │   │       │  └───────────────┬──────────────────┘       │
        │   │       │                  │                            │
        │   │       │  ┌───────────────▼──────────────────┐       │
        │   │──────►│  │     Capture & Classify Live Image │       │
        │   │       │  └──────────────────────────────────┘       │
        │   │       │                                              │
        │   │       │  ┌──────────────────────────────────┐       │
        │   │──────►│  │     Search Location by Name       │       │
        │   │       │  └──────────────────────────────────┘       │
        │   │       │                                              │
        │   │       │  ┌──────────────────────────────────┐       │
        │   │──────►│  │     Use GPS / My Location         │       │
        │   │       │  └──────────────────────────────────┘       │
        │   │       │                                              │
        │   │       │  ┌──────────────────────────────────┐       │
        │   │──────►│  │     Switch Language (EN / AR)     │       │
        │   │       │  └──────────────────────────────────┘       │
        │   │       │                                              │
        │   │       │  ┌──────────────────────────────────┐       │
        │   │──────►│  │     View Classification History   │       │
        │   │       │  └──────────────────────────────────┘       │
        │   │       │                                              │
        │   │       │  ┌──────────────────────────────────┐       │
        │   │──────►│  │     Install as PWA               │       │
        └───┘       │  └──────────────────────────────────┘       │
                    │                                              │
                    └──────────────────────────────────────────────┘
```

### Use Case Details

#### UC-01: Classify Uploaded Image
- **Actor:** User
- **Precondition:** User has a satellite image file (JPG/PNG)
- **Main Flow:**
  1. User opens the Observatory page
  2. User drags an image onto the upload zone (or clicks to browse)
  3. System displays image preview with filename and size
  4. User selects a model from the dropdown (optional, defaults to ResNet50)
  5. User clicks "Classify"
  6. System sends image to the backend API
  7. System displays the predicted class, confidence score, full breakdown, and chart
- **Postcondition:** Classification result displayed; entry added to history log

#### UC-02: Capture & Classify Live Satellite Image
- **Actor:** User
- **Precondition:** User is on the Observatory page
- **Main Flow:**
  1. User interacts with the 3D globe (drag to rotate, scroll to zoom)
  2. User clicks the globe or "Open Live Satellite View" button
  3. System transitions to satellite map view (Leaflet + ESRI tiles)
  4. User navigates to desired location
  5. User clicks "Capture & Classify"
  6. System fetches a 512×512 satellite image from ESRI ArcGIS
  7. System automatically classifies the captured image
  8. System displays results with coordinates
- **Postcondition:** Captured image displayed; classification result shown

---

## 5. Data Sources

### 5.1 Training Data

| Dataset | Source | Details |
|---------|--------|---------|
| **EuroSAT RGB** | Sentinel-2 satellite (ESA) | 27,000 labeled satellite images across 10 land cover classes. Each image is 64×64 pixels in RGB format. Data was collected from the Sentinel-2 multi-spectral imaging mission covering European territories. |

**Data Split:**

| Split | Purpose | Classes |
|-------|---------|---------|
| **Train/** | Model training | 10 folders (one per class) |
| **Valid/** | Validation during training (hyperparameter tuning) | 10 folders (one per class) |
| **Test/** | Final model evaluation (unseen data) | 10 folders (one per class) |

**The 10 Land Cover Classes:**

| # | Class Name | Description |
|---|-----------|-------------|
| 1 | AnnualCrop | Seasonal farming fields with crop rotation patterns |
| 2 | Forest | Dense tree canopy with high vegetation index |
| 3 | HerbaceousVegetation | Wild grassland or bushy terrain coverage |
| 4 | Highway | Paved road infrastructure and transport corridors |
| 5 | Industrial | Factories, warehouses, and commercial structures |
| 6 | Pasture | Open grazing land and meadow terrain |
| 7 | PermanentCrop | Vineyards, orchards, and long-term plantations |
| 8 | Residential | Urban housing and neighborhood developments |
| 9 | River | Natural flowing water bodies and waterways |
| 10 | SeaLake | Oceans, lakes, and large stationary water bodies |

### 5.2 Real-Time Data

| Source | API | Purpose |
|--------|-----|---------|
| **ESRI ArcGIS World Imagery** | REST API (MapServer/export) | Fetching live satellite images for any GPS coordinates at configurable zoom levels (10–18) |
| **Nominatim (OpenStreetMap)** | REST API (search endpoint) | Geocoding — converting place names to latitude/longitude coordinates |
| **Browser Geolocation API** | HTML5 Geolocation | Obtaining the user's current GPS position for location-based classification |

### 5.3 Pre-trained Model Weights

| Source | Model | Purpose |
|--------|-------|---------|
| **ImageNet (ILSVRC)** | ResNet50 pre-trained weights | Transfer learning backbone initialization |
| **ImageNet-22K** | Swin-Base pre-trained weights | Transfer learning for the Swin Transformer |
| **NASA HLS (via terratorch)** | Prithvi-EO 2.0 weights | Foundation model pre-trained on global satellite imagery |

---

*DEPI Program, 2026*
