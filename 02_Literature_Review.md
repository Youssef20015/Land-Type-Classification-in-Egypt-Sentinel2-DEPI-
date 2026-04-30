# Literature Review
# مراجعة الأدبيات

## GlobeClass — AI-Powered Satellite Image Land Cover Classification

---

## 1. Background & Context

Remote sensing and satellite imagery have become indispensable tools for monitoring Earth's surface. With the increasing availability of satellite data from missions such as Sentinel-2 (European Space Agency), the need for automated land cover classification systems has grown significantly. Manual interpretation of satellite images is time-consuming, subjective, and impractical at scale — making deep learning-based automation a critical advancement.

Land cover classification involves categorizing each region of a satellite image into predefined classes such as forests, water bodies, urban areas, agricultural land, and more. Accurate land cover mapping supports a wide range of applications including:

- **Urban planning and development monitoring**
- **Agricultural productivity assessment**
- **Environmental and climate change monitoring**
- **Disaster response and damage assessment**
- **Water resource management**
- **Biodiversity conservation**

The advent of deep learning, particularly Convolutional Neural Networks (CNNs) and Vision Transformers (ViTs), has revolutionized the accuracy and efficiency of satellite image classification, achieving human-level or beyond-human-level performance on standard benchmarks.

---

## 2. Previous Work & Related Studies

### 2.1 Traditional Machine Learning Approaches

Early approaches to land cover classification relied on handcrafted features and traditional machine learning algorithms:

- **Support Vector Machines (SVMs):** Used spectral and textural features extracted from satellite imagery for pixel-level classification. Mountrakis et al. (2011) provided a comprehensive review of SVM applications in remote sensing, noting accuracy levels of 70–85% depending on feature engineering quality.
  
- **Random Forests:** Belgiu and Drăguț (2016) surveyed Random Forest classifiers in remote sensing, demonstrating their robustness for multi-class land use classification but highlighting limitations in capturing spatial hierarchies.

- **K-Nearest Neighbors (KNN):** Simple distance-based classifiers were used in early land cover studies, but were limited by the curse of dimensionality in high-resolution imagery.

**Limitations:** These methods require extensive manual feature engineering, struggle with complex spatial patterns, and do not scale well to large datasets.

### 2.2 Convolutional Neural Networks (CNNs)

CNNs revolutionized image classification by automatically learning hierarchical spatial features:

- **He et al. (2016) — Deep Residual Learning (ResNet):** Introduced skip connections to train very deep networks (up to 152 layers), solving the vanishing gradient problem. ResNet50, with its 25.6 million parameters, became a standard backbone for transfer learning across visual recognition tasks.

- **Helber et al. (2019) — EuroSAT Dataset:** Created the EuroSAT dataset specifically for land cover classification using Sentinel-2 satellite images. They demonstrated that CNNs (including ResNet50) could achieve up to 98.57% accuracy on this benchmark using transfer learning from ImageNet.

- **Transfer Learning:** Yosinski et al. (2014) showed that features learned from large-scale natural image datasets (like ImageNet) transfer effectively to domain-specific tasks, significantly reducing training data requirements and improving convergence speed.

### 2.3 Vision Transformers

Transformers, originally designed for natural language processing, were adapted for computer vision:

- **Dosovitskiy et al. (2020) — Vision Transformer (ViT):** Proposed treating images as sequences of patches and applying the standard Transformer architecture. ViTs achieved competitive results with CNNs on ImageNet classification.

- **Liu et al. (2021) — Swin Transformer:** Introduced a hierarchical vision transformer that computes self-attention within shifted local windows. Key innovations include:
  - Linear computational complexity relative to image size (vs. quadratic for standard ViTs)
  - Multi-scale feature representation through hierarchical patch merging
  - Swin-Base achieved 83.5% top-1 accuracy on ImageNet with 88M parameters
  - Particularly well-suited for dense prediction tasks common in remote sensing

### 2.4 Foundation Models for Earth Observation

A recent paradigm shift involves pre-training large models on massive Earth observation datasets:

- **Jakubik et al. (2023) — Prithvi-EO:** IBM and NASA developed the Prithvi foundation model, a Vision Transformer pre-trained on NASA's Harmonized Landsat and Sentinel-2 (HLS) multi-spectral satellite imagery using Masked Autoencoder (MAE) self-supervised learning. Key characteristics:
  - Trained on globally distributed satellite data across multiple spectral bands (B, G, R, NIR, SWIR1, SWIR2)
  - Designed for versatile downstream tasks: classification, segmentation, change detection
  - Demonstrates strong zero-shot and few-shot generalization to unseen geographic regions
  - The Prithvi-EO 2.0 model with 600M parameters represents a significant advancement in geospatial AI

### 2.5 Web-Based Remote Sensing Applications

Several existing systems provide web-based satellite image analysis:

- **Google Earth Engine:** A powerful cloud platform for planetary-scale geospatial analysis, but requires specialized coding knowledge and is not focused on real-time interactive classification.
- **Microsoft Planetary Computer:** Provides access to global environmental datasets with built-in analysis tools, targeting researchers and data scientists rather than general users.
- **EO-Learn (Sentinel Hub):** A Python library for processing satellite imagery with machine learning pipelines, but lacks a consumer-facing web interface.

---

## 3. Technologies Reviewed

| Technology | Type | Relevance to Project |
|------------|------|---------------------|
| **ResNet50** | CNN Architecture | Backbone for transfer learning — proven on EuroSAT with 98%+ accuracy |
| **Swin Transformer** | Vision Transformer | Hierarchical attention mechanism ideal for multi-scale remote sensing features |
| **Prithvi-EO 2.0** | Foundation Model | Pre-trained on global satellite data, designed for Earth observation tasks |
| **PyTorch** | Deep Learning Framework | Industry-standard framework for model training and inference |
| **timm** | Model Library | Provides pre-trained weights and architecture implementations for 700+ models |
| **terratorch** | Geospatial ML Library | IBM's library for registering and using Prithvi models within the timm ecosystem |
| **Flask** | Web Framework | Lightweight Python web framework for building REST APIs |
| **Three.js** | 3D Graphics Library | WebGL-based library for rendering the interactive 3D Earth globe |
| **Leaflet.js** | Mapping Library | Open-source library for interactive satellite maps with ESRI tile integration |
| **EuroSAT** | Benchmark Dataset | Standard dataset for satellite image land cover classification (27K images, 10 classes) |
| **ESRI World Imagery** | Satellite Tile Service | Provides real-time satellite imagery for any location globally |
| **Sentinel-2** | Satellite Mission | Source of the EuroSAT dataset — ESA's multi-spectral imaging satellite |

---

## 4. Gaps in Existing Work

Despite significant progress in satellite image classification, several gaps remain that GlobeClass addresses:

| # | Gap | How GlobeClass Addresses It |
|---|-----|----------------------------|
| 1 | **Lack of user-friendly interfaces:** Most existing tools (Google Earth Engine, EO-Learn) require programming expertise and are designed for researchers, not general users. | GlobeClass provides an intuitive, visually stunning web interface with a 3D globe, drag-and-drop image upload, and one-click classification accessible to anyone. |
| 2 | **Single-model systems:** Most deployed classification tools use a single model architecture without offering users a choice. | GlobeClass deploys three distinct architectures (ResNet50, Swin Transformer, Prithvi-EO) and allows users to switch between them in real-time to compare results. |
| 3 | **No real-time satellite capture integration:** Existing classification systems typically require users to pre-download satellite images from separate platforms. | GlobeClass integrates ESRI World Imagery to capture live satellite views from any coordinates, directly feeding them into the classification pipeline. |
| 4 | **Limited accessibility and language support:** Most remote sensing tools are English-only and lack Progressive Web App capabilities. | GlobeClass features full English/Arabic bilingual support and PWA functionality for offline access and mobile installation. |
| 5 | **No foundation model deployment for classification:** While Prithvi-EO was released as a research model, practical deployments in web-based classification interfaces are scarce. | GlobeClass adapts and deploys the Prithvi-EO 2.0 foundation model with a custom RGB-to-6-band channel adapter, making it accessible through a web API. |
| 6 | **Opaque classification results:** Many systems output only the top predicted class without detailed confidence breakdowns. | GlobeClass provides full 10-class probability distributions with interactive charts, animated breakdowns, and classification logging history. |

---

## 5. References

1. He, K., Zhang, X., Ren, S., & Sun, J. (2016). "Deep Residual Learning for Image Recognition." *Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR)*, pp. 770–778.

2. Helber, P., Bischke, B., Dengel, A., & Borth, D. (2019). "EuroSAT: A Novel Dataset and Deep Learning Benchmark for Land Use and Land Cover Classification." *IEEE Journal of Selected Topics in Applied Earth Observations and Remote Sensing*, 12(7), pp. 2217–2226.

3. Liu, Z., Lin, Y., Cao, Y., Hu, H., Wei, Y., Zhang, Z., Lin, S., & Guo, B. (2021). "Swin Transformer: Hierarchical Vision Transformer using Shifted Windows." *Proceedings of the IEEE/CVF International Conference on Computer Vision (ICCV)*, pp. 10012–10022.

4. Jakubik, J., Roy, S., Phillips, C. E., Fraccaro, P., Godwin, D., Zadrozny, B., ... & Mukkavilli, K. (2023). "Foundation Models for Generalist Geospatial Artificial Intelligence." *arXiv preprint arXiv:2310.18660*.

5. Dosovitskiy, A., Beyer, L., Kolesnikov, A., Weissenborn, D., Zhai, X., Unterthiner, T., ... & Houlsby, N. (2020). "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale." *arXiv preprint arXiv:2010.11929*.

6. Yosinski, J., Clune, J., Bengio, Y., & Lipson, H. (2014). "How Transferable are Features in Deep Neural Networks?" *Advances in Neural Information Processing Systems (NeurIPS)*, 27.

7. Mountrakis, G., Im, J., & Ogole, C. (2011). "Support Vector Machines in Remote Sensing: A Review." *ISPRS Journal of Photogrammetry and Remote Sensing*, 66(3), pp. 247–259.

8. Belgiu, M., & Drăguț, L. (2016). "Random Forest in Remote Sensing: A Review of Applications and Future Directions." *ISPRS Journal of Photogrammetry and Remote Sensing*, 114, pp. 24–31.

9. European Space Agency (ESA). "Sentinel-2 Mission." Available: https://sentinel.esa.int/web/sentinel/missions/sentinel-2

10. IBM & NASA. "Prithvi-EO Foundation Model." Available: https://huggingface.co/ibm-nasa-geospatial

---

*Document prepared by: Abdelrahman Ehab — DEPI Program, 2026*
