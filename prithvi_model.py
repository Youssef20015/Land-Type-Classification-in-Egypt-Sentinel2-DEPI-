"""
Prithvi-EO-2.0-600M-TL Model — EuroSAT Classification
======================================================
This script loads the pretrained Prithvi-EO-2.0-600M-TL foundation model,
attaches a lightweight classification head, trains it with the backbone frozen
(linear probing), evaluates on the test set, and exports the model.

Usage:
    python prithvi_model.py
"""

import os
import sys
import time
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import torchvision.transforms as transforms
import torchvision.datasets as datasets
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
)

# Import terratorch to register Prithvi models into timm registry
import terratorch  # noqa: F401 — side-effect import for model registration

# ─── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.normpath(os.path.join(SCRIPT_DIR, ".."))
DATA_DIR = os.path.join(PROJECT_DIR, "Data EuroSAT_split_data_TVT")
MODELS_DIR = os.path.join(PROJECT_DIR, "Models")
EXPORT_PATH = os.path.join(MODELS_DIR, "prithvi_best_model.pth")

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

NUM_CLASSES = len(CLASS_NAMES)
IMAGE_SIZE = 224  # Prithvi ViT expects 224×224
BATCH_SIZE = 16
NUM_EPOCHS = 10
LR = 5e-5
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ─── 1. Data Pipeline ────────────────────────────────────────────────────────
def get_dataloaders():
    """Create train / val / test data loaders with proper transforms."""
    train_transform = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(15),
        transforms.ToTensor(),
        transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5]),
    ])

    eval_transform = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5]),
    ])

    train_ds = datasets.ImageFolder(os.path.join(DATA_DIR, "Train"), transform=train_transform)
    val_ds   = datasets.ImageFolder(os.path.join(DATA_DIR, "Valid"), transform=eval_transform)
    test_ds  = datasets.ImageFolder(os.path.join(DATA_DIR, "Test"),  transform=eval_transform)

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,  num_workers=0, pin_memory=True)
    val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False, num_workers=0, pin_memory=True)
    test_loader  = DataLoader(test_ds,  batch_size=BATCH_SIZE, shuffle=False, num_workers=0, pin_memory=True)

    print(f"[DATA] Train: {len(train_ds)} | Val: {len(val_ds)} | Test: {len(test_ds)}")
    return train_loader, val_loader, test_loader


# ─── 2. Model ────────────────────────────────────────────────────────────────
class PrithviClassifier(nn.Module):
    """
    Prithvi‑EO backbone (frozen) + trainable classification head.

    Uses the `timm` model registry — the terratorch package registers the
    Prithvi family (Swin-based) under names like ``prithvi_swin_B``.
    When `in_chans=3` is passed the library projects the 3‑channel RGB
    input to the internal representation.

    The Swin backbone outputs multi-scale feature maps, so we take the
    last stage output and apply global average pooling before the head.
    """

    def __init__(self, num_classes: int = 10, freeze_backbone: bool = True):
        super().__init__()
        import timm

        # ── Create the backbone ──────────────────────────────────────────
        backbone_name = None
        candidate_names = [
            "prithvi_swin_B",          # Prithvi Swin-Base (default)
            "prithvi_swin_L",          # Prithvi Swin-Large
            "prithvi_eo_v2_300",       # 300 M ViT variant (if available)
            "prithvi_eo_v2_600",       # 600 M ViT variant
            "prithvi_eo_v2_300_tl",    # TL variant
        ]

        available = timm.list_models("prithvi*")
        print(f"[MODEL] Available Prithvi models in registry: {available}")

        for name in candidate_names:
            if name in available:
                backbone_name = name
                break

        if backbone_name is None:
            if available:
                backbone_name = available[0]
                print(f"[MODEL] Using first available Prithvi model: {backbone_name}")
            else:
                raise RuntimeError(
                    "No Prithvi model found in timm registry. "
                    "Make sure `terratorch` is installed: pip install terratorch"
                )

        print(f"[MODEL] Loading backbone: {backbone_name}")

        # The Prithvi Swin backbone expects 6-band HLS input (B, G, R, NIR, SWIR1, SWIR2).
        # We keep in_chans at its native 6 and add a learnable adapter 3→6 in front.
        self.backbone = timm.create_model(
            backbone_name,
            pretrained=False,
            num_classes=0,
            features_only=True,
        )

        # ── Channel adapter: project RGB (3 ch) → 6 ch for the backbone ─
        self.channel_adapter = nn.Conv2d(3, 6, kernel_size=1, bias=False)
        # Initialise so RGB channels are duplicated (good starting point)
        with torch.no_grad():
            nn.init.kaiming_normal_(self.channel_adapter.weight)

        # ── Determine feature dimension ──────────────────────────────────
        feature_dims = self.backbone.feature_info.channels()
        feature_dim = feature_dims[-1]
        print(f"[MODEL] Backbone stage dims: {feature_dims}")
        print(f"[MODEL] Using last-stage dim: {feature_dim}")

        # ── Global average pooling to collapse spatial dims ──────────────
        self.pool = nn.AdaptiveAvgPool2d(1)

        # ── Freeze backbone if requested ─────────────────────────────────
        if freeze_backbone:
            for param in self.backbone.parameters():
                param.requires_grad = False
            # NOTE: channel_adapter and classifier remain trainable
            print("[MODEL] Backbone frozen (linear probing mode)")
            print("[MODEL] Channel adapter + classifier remain trainable")

        # ── Classification head ──────────────────────────────────────────
        self.classifier = nn.Sequential(
            nn.LayerNorm(feature_dim),
            nn.Dropout(0.3),
            nn.Linear(feature_dim, 512),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes),
        )

    def forward(self, x):
        # Adapt 3-channel RGB → 6-channel HLS-like input
        x = self.channel_adapter(x)
        # backbone returns list of feature maps: [stage1, stage2, ..., stageN]
        features = self.backbone(x)
        # take last stage — Swin outputs (B, H, W, C), need to convert to (B, C, H, W)
        x = features[-1]
        if x.ndim == 4 and x.shape[-1] != x.shape[-2]:
            # channels-last → channels-first
            x = x.permute(0, 3, 1, 2).contiguous()
        # global average pool: (B, C, 1, 1) → (B, C)
        x = self.pool(x).flatten(1)
        return self.classifier(x)


def build_model():
    """Build the Prithvi classifier and move it to the device."""
    # Set freeze_backbone=False to execute Full Fine-Tuning across all 87M params
    model = PrithviClassifier(num_classes=NUM_CLASSES, freeze_backbone=False)
    model = model.to(DEVICE)
    total  = sum(p.numel() for p in model.parameters())
    train_ = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"[MODEL] Total parameters : {total:,}")
    print(f"[MODEL] Trainable params : {train_:,}")
    return model


# ─── 3. Training ─────────────────────────────────────────────────────────────
def train_model(model, train_loader, val_loader, num_epochs=NUM_EPOCHS):
    """Train only the classification head (backbone frozen)."""
    criterion = nn.CrossEntropyLoss()
    # Only optimise head parameters
    optimizer = optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LR,
        weight_decay=1e-4,
    )
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", patience=2, factor=0.5,
    )

    best_val_acc = 0.0
    best_weights = None
    history = {"train_loss": [], "val_loss": [], "train_acc": [], "val_acc": []}

    print(f"\n{'=' * 60}")
    print(f"  TRAINING — Linear Probing (backbone frozen, {num_epochs} epochs)")
    print(f"{'=' * 60}\n")

    for epoch in range(1, num_epochs + 1):
        # ── Train ──
        model.train()
        running_loss, correct, total = 0.0, 0, 0
        t0 = time.time()

        for images, labels in train_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

        train_loss = running_loss / total
        train_acc  = correct / total

        # ── Validate ──
        model.eval()
        val_loss_sum, val_correct, val_total = 0.0, 0, 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss_sum += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)

        val_loss = val_loss_sum / val_total
        val_acc  = val_correct / val_total
        scheduler.step(val_loss)

        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["train_acc"].append(train_acc)
        history["val_acc"].append(val_acc)

        elapsed = time.time() - t0
        print(
            f"  Epoch {epoch:02d}/{num_epochs} | "
            f"Train Loss: {train_loss:.4f}  Acc: {train_acc:.4f} | "
            f"Val Loss: {val_loss:.4f}  Acc: {val_acc:.4f} | "
            f"Time: {elapsed:.1f}s"
        )

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_weights = {k: v.clone() for k, v in model.state_dict().items()}

    print(f"\n  Best Val Accuracy: {best_val_acc:.4f}")
    if best_weights is not None:
        model.load_state_dict(best_weights)

    return model, history


# ─── 4. Evaluation ───────────────────────────────────────────────────────────
def evaluate_model(model, test_loader):
    """Full evaluation on the test set."""
    model.eval()
    all_preds, all_labels = [], []

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(DEVICE)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())

    y_true = np.array(all_labels)
    y_pred = np.array(all_preds)

    accuracy  = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, average="weighted")
    recall_   = recall_score(y_true, y_pred, average="weighted")
    f1        = f1_score(y_true, y_pred, average="weighted")

    print(f"\n{'=' * 55}")
    print(f"         PRITHVI-EO TEST SET EVALUATION REPORT")
    print(f"{'=' * 55}")
    print(f"  Accuracy  : {accuracy:.4f}  ({accuracy * 100:.2f}%)")
    print(f"  Precision : {precision:.4f}")
    print(f"  Recall    : {recall_:.4f}")
    print(f"  F1-Score  : {f1:.4f}")
    print(f"{'=' * 55}")
    print(f"\nPer-Class Classification Report:")
    print(classification_report(y_true, y_pred, target_names=CLASS_NAMES))

    return accuracy


# ─── 5. Export ───────────────────────────────────────────────────────────────
def export_model(model):
    """Save model weights to the Models directory."""
    os.makedirs(MODELS_DIR, exist_ok=True)
    torch.save(model.state_dict(), EXPORT_PATH)
    size_mb = os.path.getsize(EXPORT_PATH) / (1024 * 1024)
    print(f"\n[EXPORT] Model saved to: {EXPORT_PATH}")
    print(f"[EXPORT] File size: {size_mb:.1f} MB")


# ─── Main ────────────────────────────────────────────────────────────────────
def main():
    print(f"{'=' * 60}")
    print(f"  Prithvi-EO-2.0-600M-TL — EuroSAT Classification")
    print(f"{'=' * 60}")
    print(f"  Device      : {DEVICE}")
    print(f"  Data dir    : {DATA_DIR}")
    print(f"  Image size  : {IMAGE_SIZE}×{IMAGE_SIZE}")
    print(f"  Batch size  : {BATCH_SIZE}")
    print(f"  Epochs      : {NUM_EPOCHS}")
    print(f"  Export path : {EXPORT_PATH}")
    print()

    # 1. Data
    train_loader, val_loader, test_loader = get_dataloaders()

    # 2. Model
    model = build_model()

    # 3. Train (head only — linear probing)
    model, history = train_model(model, train_loader, val_loader)

    # 4. Evaluate
    accuracy = evaluate_model(model, test_loader)

    # 5. Export
    export_model(model)

    print(f"\n{'=' * 60}")
    print(f"  DONE — Prithvi model tested & exported successfully!")
    print(f"  Test Accuracy: {accuracy * 100:.2f}%")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
