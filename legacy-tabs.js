document.addEventListener('DOMContentLoaded', () => {
    // Legacy Section Models — bilingual
    const legacyModels = {
        "resnet50": {
            desc: {
                en: "Our ResNet50 model was trained using transfer learning on the EuroSAT RGB satellite dataset. A two-phase training strategy — freezing the backbone, then fine-tuning all 24M parameters — achieves state-of-the-art performance on land cover classification.",
                ar: "تم تدريب نموذج ResNet50 باستخدام التعلّم بالنقل على مجموعة بيانات EuroSAT للأقمار الاصطناعية. استراتيجية تدريب من مرحلتين — تجميد العمود الفقري ثم الضبط الدقيق لجميع المعلمات البالغ عددها ٢٤ مليون — تحقق أداءً متميزاً في تصنيف الغطاء الأرضي."
            },
            acc: "98.25%",
            params: "24M",
            trainImgs: "27K",
            title: { en: "ResNet50 Architecture", ar: "بنية ResNet50" },
            subtitle: { en: "Transfer Learning from ImageNet", ar: "التعلّم بالنقل من ImageNet" },
            icon: "psychology",
            themeClass: "text-primary",
            bgClass: "bg-primary/20",
            borderClass: "border-primary/20",
            phases: [
                { text: { en: "Phase 1: Feature Extraction (Backbone Frozen)", ar: "المرحلة ١: استخراج السمات (العمود الفقري مجمّد)" }, value: "80.3% acc", active: false },
                { text: { en: "Phase 2: Fine-Tuning (All Layers)", ar: "المرحلة ٢: الضبط الدقيق (جميع الطبقات)" }, value: "98.2% acc", active: false },
                { text: { en: "Final Test Evaluation", ar: "التقييم النهائي" }, value: "98.25%", active: true }
            ],
            techStack: ["PyTorch", "ResNet50", "Flask", "EuroSAT"]
        },
        "swin": {
            desc: {
                en: "We deployed a Swin Transformer (Base) architecture adapted for Earth Observation. By computing self-attention within shifted local windows, the hierarchy captures multi-scale remote sensing features with exceptional scaling efficiency.",
                ar: "نشرنا بنية Swin Transformer (Base) المكيّفة لرصد الأرض. من خلال حساب الانتباه الذاتي ضمن نوافذ محلية منزاحة، تلتقط البنية الهرمية سمات الاستشعار عن بُعد متعددة المقاييس بكفاءة استثنائية."
            },
            acc: "98.42%",
            params: "88M",
            trainImgs: "27K",
            title: { en: "Swin Transformer (Base)", ar: "محوّل Swin (Base)" },
            subtitle: { en: "Shifted Window Hierarchical Vision Transformer", ar: "محوّل رؤية هرمي بالنوافذ المنزاحة" },
            icon: "grid_view",
            themeClass: "text-purple-400",
            bgClass: "bg-purple-400/20",
            borderClass: "border-purple-400/20",
            phases: [
                { text: { en: "Phase 1: Patch Partition & Linear Embedding", ar: "المرحلة ١: تقسيم الرقع والتضمين الخطي" }, value: "Resolution/4", active: false },
                { text: { en: "Phase 2: W-MSA & SW-MSA Blocks", ar: "المرحلة ٢: كتل W-MSA و SW-MSA" }, value: "4 Stages", active: false },
                { text: { en: "Final Validation mIoU", ar: "التحقق النهائي mIoU" }, value: "98.42%", active: true }
            ],
            techStack: ["PyTorch", "timm", "Swin-B", "EuroSAT"]
        },
        "prithvi": {
            desc: {
                en: "The Prithvi-EO 2.0 foundation model, pre-trained globally on NASA HLS multi-spectral imagery. We un-froze the Swin-B backbone and fine-tuned it on EuroSAT, achieving incredible zero-shot generalization capabilities.",
                ar: "نموذج الأساس Prithvi-EO 2.0، مُدرَّب مسبقاً عالمياً على صور NASA HLS متعددة الأطياف. قمنا بإلغاء تجميد العمود الفقري Swin-B وضبطه دقيقاً على EuroSAT، محققين قدرات تعميم مذهلة."
            },
            acc: "91.23%",
            params: "87M",
            trainImgs: "27K",
            title: { en: "Prithvi-EO 2.0 Foundation", ar: "نموذج أساس Prithvi-EO 2.0" },
            subtitle: { en: "MAE Self-Supervised Vision Transformer", ar: "محوّل رؤية ذاتي الإشراف MAE" },
            icon: "public",
            themeClass: "text-emerald-400",
            bgClass: "bg-emerald-400/20",
            borderClass: "border-emerald-400/20",
            phases: [
                { text: { en: "Phase 1: IBM/NASA Foundation Pre-training", ar: "المرحلة ١: التدريب المسبق IBM/NASA" }, value: "MAE", active: false },
                { text: { en: "Phase 2: Channel Adapter (RGB to 6-band)", ar: "المرحلة ٢: محوّل القنوات (RGB إلى ٦ نطاقات)" }, value: "Conv2d", active: false },
                { text: { en: "Full Fine-Tuning Accuracy", ar: "دقة الضبط الدقيق الكامل" }, value: "91.23%", active: true }
            ],
            techStack: ["terratorch", "timm", "Prithvi 2.0", "HLS"]
        }
    };

    function getLang() {
        return localStorage.getItem('globeclass-lang') || 'en';
    }

    function t(obj) {
        if (typeof obj === 'string') return obj;
        const lang = getLang();
        return obj[lang] || obj.en;
    }

    const tabBtns = document.querySelectorAll('.legacy-tab-btn');
    const cardEl = document.getElementById('legacy-card');
    
    const elDesc = document.getElementById('legacy-model-desc');
    const elAcc = document.getElementById('legacy-acc');
    const elParams = document.getElementById('legacy-params');
    const elTrain = document.getElementById('legacy-train-imgs');
    const elIcon = document.getElementById('legacy-icon');
    const elIconBg = document.getElementById('legacy-icon-bg');
    const elTitle = document.getElementById('legacy-card-title');
    const elSub = document.getElementById('legacy-card-subtitle');
    const phaseContainer = document.getElementById('legacy-phase-container');
    const techStackContainer = document.getElementById('legacy-tech-stack');

    let activeModelKey = 'resnet50';

    function renderModel(modelKey, animate) {
        const m = legacyModels[modelKey];
        if (!m) return;
        activeModelKey = modelKey;

        const doRender = () => {
            elDesc.textContent = t(m.desc);
            elAcc.textContent = m.acc;
            elParams.textContent = m.params;
            elTrain.textContent = m.trainImgs;

            elTitle.textContent = t(m.title);
            elSub.textContent = t(m.subtitle);
            elIcon.textContent = m.icon;
            
            elIcon.className = `material-symbols-outlined text-2xl ${m.themeClass}`;
            elIconBg.className = `w-12 h-12 rounded-xl flex items-center justify-center ${m.bgClass}`;
            
            elAcc.className = `text-4xl font-black mb-1 ${m.themeClass}`;
            elParams.className = `text-4xl font-black mb-1 ${m.themeClass}`;
            elTrain.className = `text-4xl font-black mb-1 ${m.themeClass}`;

            phaseContainer.innerHTML = '';
            m.phases.forEach(phase => {
                const phaseText = t(phase.text);
                if (phase.active) {
                    phaseContainer.innerHTML += `
                        <div class="flex items-center gap-3 p-3 rounded-lg border transition-transform hover:scale-[1.02] ${m.bgClass.replace('/20','/10')} ${m.borderClass}">
                            <span class="material-symbols-outlined text-sm ${m.themeClass}">verified</span>
                            <span class="text-sm font-bold ${m.themeClass}">${phaseText}</span>
                            <span class="ml-auto text-xs font-mono font-bold ${m.themeClass}">${phase.value}</span>
                        </div>
                    `;
                } else {
                    phaseContainer.innerHTML += `
                        <div class="flex items-center gap-3 p-3 bg-surface-container-high rounded-lg border border-outline-variant/5 transition-transform hover:scale-[1.02]">
                            <span class="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                            <span class="text-sm text-slate-300 font-medium">${phaseText}</span>
                            <span class="ml-auto text-xs text-slate-500 font-mono">${phase.value}</span>
                        </div>
                    `;
                }
            });

            techStackContainer.innerHTML = '';
            m.techStack.forEach(tech => {
                techStackContainer.innerHTML += `<span class="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold text-slate-400 border border-outline-variant/10">${tech}</span>`;
            });
        };

        if (animate && cardEl) {
            cardEl.style.opacity = '0.4';
            cardEl.style.transform = 'translateY(10px)';
            setTimeout(() => {
                doRender();
                cardEl.style.opacity = '1';
                cardEl.style.transform = 'translateY(0)';
            }, 200);
        } else {
            doRender();
        }
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modelKey = btn.getAttribute('data-model');

            tabBtns.forEach(b => {
                b.classList.remove('active', 'text-primary');
                b.classList.add('text-slate-400');
            });
            btn.classList.add('active', 'text-primary');
            btn.classList.remove('text-slate-400');

            renderModel(modelKey, true);
        });
    });

    // Re-render current model when language changes
    window.addEventListener('langChanged', () => {
        renderModel(activeModelKey, false);
    });
});
