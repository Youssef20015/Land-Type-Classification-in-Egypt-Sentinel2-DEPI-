document.addEventListener('DOMContentLoaded', () => {
    function getLang() {
        return localStorage.getItem('globeclass-lang') || 'en';
    }
    function t(obj) {
        if (typeof obj === 'string') return obj;
        const lang = getLang();
        return obj[lang] || obj.en;
    }

    // 3 Models Array — bilingual
    const models = [
        {
            id: "resnet50",
            name: "ResNet50",
            indexStr: "01",
            latency: "18ms",
            status: { en: "ACTIVE NODE", ar: "عقدة نشطة" },
            desc: {
                en: "A powerful spatial feature network based on residual connections. Ideal for generalized classification and high-throughput real-time APIs.",
                ar: "شبكة سمات مكانية قوية مبنية على الاتصالات التبقيّة. مثالية للتصنيف العام وواجهات البرمجة الفورية عالية الإنتاجية."
            },
            params: "25.6M",
            paramType: { en: "dense", ar: "كثيف" },
            accuracy: "98.25%",
            accVar: "val_acc",
            strategy: { en: "Transfer Learning", ar: "التعلّم بالنقل" },
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCBCSH2sTOxsS45gtOCsu2rbmyRh64YA_oio_tVL5HRZ99UDNHelENkYgVV2i3RmIJd71bhexphRS_YqmFkeaDmQ-NdkAqJNYQCCbkAK4HaeVfSIJ0Ua6UdfC-GS9VOx15wMtTu1adGPErNFOUkwSP7fTAFYzPscteJWCTN0wPCZPw8eJQdpNwpUfkzDf1qPvrQdPCE2RSrPx6xvqk9Sx3c7OB_tFcHPVzSrbjKc97L2ra9f3B8chU3iXG0VCGEhOAaYVrlWoUy",
        },
        {
            id: "swin",
            name: "Swin Transformer",
            indexStr: "02",
            latency: "32ms",
            status: { en: "ACTIVE NODE", ar: "عقدة نشطة" },
            desc: {
                en: "A hierarchical vision transformer utilizing shifted windows perfectly suited for capturing multi-scale remote sensing features.",
                ar: "محوّل رؤية هرمي يستخدم النوافذ المنزاحة ومناسب تماماً لالتقاط سمات الاستشعار عن بُعد متعددة المقاييس."
            },
            params: "88M",
            paramType: { en: "attention", ar: "انتباه" },
            accuracy: "98.42%",
            accVar: "val_acc",
            strategy: { en: "Shifted Self-Attention", ar: "انتباه ذاتي منزاح" },
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCZXxYK7qvZ0itjhYH37f0DUwgzyBSSmOSjlkPrXVvj5q9WSmC7lqk2o668yILU8WmS3T3lWMhMWsZCTiVgJacvYO_qYt4zBbtyjmKHx4kW2dVP_IFnk3MzbjrgJArzCuekQHdVcFw76VYUb9L2hJgM8GhP-IYtwTmh88Cuo1i4HSUP-GFGnehWWdaKyXKps-W8gcYfPaZLQIcgRW3QWiTUmCSWP6YaOqMt5z8I_EPCwWw6eZb_LKD0V7jiT0EFCmUCleBJM8En",
        },
        {
            id: "prithvi",
            name: "Prithvi-EO 2.0",
            indexStr: "03",
            latency: "42ms",
            status: { en: "ACTIVE FOUNDATION", ar: "نموذج أساس نشط" },
            desc: {
                en: "A foundation model for Earth Observation trained on multi-spectral satellite imagery using masked autoencoders.",
                ar: "نموذج أساس لرصد الأرض مُدرَّب على صور أقمار اصطناعية متعددة الأطياف باستخدام المشفّرات التلقائية المقنّعة."
            },
            params: "87M",
            paramType: { en: "dense", ar: "كثيف" },
            accuracy: "91.23%",
            accVar: "mIoU",
            strategy: { en: "MAE Self-Supervised", ar: "MAE ذاتي الإشراف" },
            image: "/static/images/prithvi_satellite.png",
        }
    ];

    // Labels for the card stat headers — bilingual
    const labels = {
        parameters: { en: "Parameters", ar: "المعلمات" },
        accuracy: { en: "Accuracy", ar: "الدقة" },
        strategy: { en: "Training Strategy", ar: "استراتيجية التدريب" },
        latency: { en: "Interference Latency", ar: "زمن الاستجابة" },
        deploy: { en: "Deploy Model", ar: "نشر النموذج" }
    };

    let currentIndex = 2; // Default to Prithvi

    const btnPrev = document.getElementById('carousel-btn-prev');
    const btnNext = document.getElementById('carousel-btn-next');
    const dots = document.querySelectorAll('.carousel-dot');
    
    // Front card DOM elements
    const fcName = document.getElementById('fc-name');
    const fcDesc = document.getElementById('fc-desc');
    const fcParams = document.getElementById('fc-params');
    const fcParamType = document.getElementById('fc-param-type');
    const fcAcc = document.getElementById('fc-acc');
    const fcAccVar = document.getElementById('fc-acc-var');
    const fcStrategy = document.getElementById('fc-strategy');
    const fcLatency = document.getElementById('fc-latency');
    const fcImage = document.getElementById('fc-image');
    const fcStatus = document.getElementById('fc-status');

    // Stat label elements
    const labelParams = document.querySelector('[data-i18n="arch-card-params"]');
    const labelAcc = document.querySelector('[data-i18n="arch-card-accuracy"]');
    const labelStrategy = document.querySelector('[data-i18n="arch-card-strategy"]');
    const labelLatency = document.querySelector('[data-i18n="arch-card-latency"]');
    const labelDeploy = document.querySelector('[data-i18n="arch-card-deploy"]');

    // Background card DOM elements
    const bc1Name = document.getElementById('bc1-name');
    const bc1Idx = document.getElementById('bc1-idx');

    function updateCarousel(animate) {
        const currentModel = models[currentIndex];
        const bc1Index = (currentIndex - 1 + models.length) % models.length;
        const bc1Model = models[bc1Index];

        const frontCard = document.getElementById('card-front');
        if (!frontCard) return;

        const doRender = () => {
            if (fcName) fcName.textContent = currentModel.name;
            if (fcDesc) fcDesc.textContent = t(currentModel.desc);
            if (fcParams) fcParams.textContent = currentModel.params;
            if (fcParamType) fcParamType.textContent = t(currentModel.paramType);
            if (fcAcc) fcAcc.textContent = currentModel.accuracy;
            if (fcAccVar) fcAccVar.textContent = currentModel.accVar;
            if (fcStrategy) fcStrategy.textContent = t(currentModel.strategy);
            if (fcLatency) fcLatency.textContent = currentModel.latency;
            if (fcImage) fcImage.src = currentModel.image;
            if (fcStatus) fcStatus.textContent = t(currentModel.status);

            // Update stat labels
            if (labelParams) labelParams.textContent = t(labels.parameters);
            if (labelAcc) labelAcc.textContent = t(labels.accuracy);
            if (labelStrategy) labelStrategy.textContent = t(labels.strategy);
            if (labelLatency) labelLatency.textContent = t(labels.latency);
            if (labelDeploy) labelDeploy.textContent = t(labels.deploy);

            if (bc1Name) bc1Name.textContent = bc1Model.name;
            if (bc1Idx) bc1Idx.textContent = bc1Model.indexStr;

            dots.forEach((dot, idx) => {
                dot.className = 'carousel-dot w-2 h-2 rounded-full transition-all duration-300 ' + 
                                (idx === currentIndex ? 'bg-primary' : 'bg-white/20');
            });
        };

        if (animate) {
            frontCard.style.opacity = '0.5';
            frontCard.style.transform = 'translateY(10px) scale(0.98)';
            frontCard.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            setTimeout(() => {
                doRender();
                frontCard.style.opacity = '1';
                frontCard.style.transform = 'translateY(0px) scale(1)';
            }, 150);
        } else {
            doRender();
        }
    }

    if (btnPrev && btnNext) {
        btnPrev.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + models.length) % models.length;
            updateCarousel(true);
        });

        btnNext.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % models.length;
            updateCarousel(true);
        });
        
        updateCarousel(false); // Initialize
    }

    // Re-render when language changes
    window.addEventListener('langChanged', () => {
        updateCarousel(false);
    });
});
