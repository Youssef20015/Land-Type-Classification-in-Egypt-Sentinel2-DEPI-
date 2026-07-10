/**
 * GlobeClass i18n — Celestial Linguistic Bridge
 * Handles EN ↔ AR switching with RTL, font scaling, and localStorage persistence.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'globeclass-lang';

    // ─── Comprehensive Dictionary ───────────────────────────────────────────────
    const dict = {
        // ── Shared Navigation ──
        "nav-brand":                { en: "GlobeClass",                    ar: "غلوب كلاس" },
        "nav-explore":              { en: "Explore",                       ar: "استكشاف" },
        "nav-observatory":          { en: "Observatory",                   ar: "المرصد" },
        "nav-collections":          { en: "Collections",                   ar: "التصنيفات" },
        "nav-launch-lab":           { en: "Launch Lab",                    ar: "إطلاق المختبر" },

        // ── Landing Page — Hero ──
        "hero-title":               { en: "Behold the Infinite.",          ar: "تأمَّل اللانهائي." },
        "hero-subtitle":            { en: "AI-powered satellite image classification using deep learning. Decode Earth's land cover from space with our ResNet50 neural network — trained on 27,000 satellite images, 98.25% accuracy.", 
                                      ar: "تصنيف صور الأقمار الاصطناعية بالذكاء الاصطناعي باستخدام التعلّم العميق. فكّ شفرة الغطاء الأرضي من الفضاء بشبكة ResNet50 العصبية — مدرّبة على ٢٧٬٠٠٠ صورة قمر اصطناعي، بدقة ٩٨.٢٥٪." },
        "hero-cta-launch":          { en: "Launch Classification",         ar: "بدء التصنيف" },
        "hero-cta-how":             { en: "How It Works",                  ar: "كيف يعمل" },

        // ── Landing Page — Neural Architectures ──
        "arch-badge":               { en: "Deep Learning Core",            ar: "نواة التعلّم العميق" },
        "arch-title-1":             { en: "Neural",                        ar: "البُنَى" },
        "arch-title-2":             { en: "Architectures",                 ar: "العصبية" },
        "arch-desc":                { en: "Interrogate our state-of-the-art vision foundations. From classic residuals to multi-spectral foundation models designed for orbital intelligence.",
                                      ar: "استكشف أُسس الرؤية الحاسوبية الأحدث. من الشبكات التبقيّة الكلاسيكية إلى نماذج الأساس متعددة الأطياف المصممة للذكاء المداري." },
        "arch-stat-dataset":        { en: "Training Dataset",              ar: "بيانات التدريب" },
        "arch-stat-gpu":            { en: "RGB Images",                    ar: "صور RGB" },
        "arch-card-params":         { en: "Parameters",                    ar: "المعلمات" },
        "arch-card-accuracy":       { en: "Accuracy",                      ar: "الدقة" },
        "arch-card-strategy":       { en: "Training Strategy",             ar: "استراتيجية التدريب" },
        "arch-card-latency":        { en: "Interference Latency",          ar: "زمن الاستجابة" },
        "arch-card-deploy":         { en: "Deploy Model",                  ar: "نشر النموذج" },

        // ── Landing Page — How It Works ──
        "hiw-badge":                { en: "The Pipeline",                  ar: "خط الأنابيب" },
        "hiw-title":                { en: "How GlobeClass Works",          ar: "كيف يعمل غلوب كلاس" },
        "hiw-subtitle":             { en: "Three simple steps from satellite image to intelligent classification.", ar: "ثلاث خطوات بسيطة من صورة القمر الاصطناعي إلى التصنيف الذكي." },
        "hiw-step1-label":          { en: "Step 01",                       ar: "الخطوة ٠١" },
        "hiw-step1-title":          { en: "Upload Image",                  ar: "رفع الصورة" },
        "hiw-step1-desc":           { en: "Drop any satellite or aerial image into the observatory. We accept JPG, PNG — the model handles the rest internally.", ar: "أسقط أي صورة قمر اصطناعي أو جوية في المرصد. نقبل JPG و PNG — يتولى النموذج الباقي داخلياً." },
        "hiw-step2-label":          { en: "Step 02",                       ar: "الخطوة ٠٢" },
        "hiw-step2-title":          { en: "Neural Classification",         ar: "التصنيف العصبي" },
        "hiw-step2-desc":           { en: "Our ResNet50 model — fine-tuned on the EuroSAT dataset — processes the image through 24M+ parameters to classify land cover.", ar: "نموذج ResNet50 — المضبوط على مجموعة بيانات EuroSAT — يعالج الصورة عبر ٢٤ مليون+ معلمة لتصنيف الغطاء الأرضي." },
        "hiw-step3-label":          { en: "Step 03",                       ar: "الخطوة ٠٣" },
        "hiw-step3-title":          { en: "Instant Results",               ar: "نتائج فورية" },
        "hiw-step3-desc":           { en: "Get real-time confidence scores across all 10 land cover classes — visualized with interactive charts and animated breakdowns.", ar: "احصل على درجات الثقة الفورية عبر جميع فئات الغطاء الأرضي العشر — مرئية برسوم بيانية تفاعلية." },

        // ── Landing Page — Land Cover Classes ──
        "classes-badge":            { en: "The Classes",                   ar: "الفئات" },
        "classes-title":            { en: "10 Land Cover Categories",      ar: "١٠ فئات للغطاء الأرضي" },
        "classes-subtitle":         { en: "Our model classifies satellite imagery into these distinct terrain types from the EuroSAT dataset.", ar: "يصنّف نموذجنا صور الأقمار الاصطناعية إلى أنواع التضاريس المميزة هذه من مجموعة بيانات EuroSAT." },
        "classes-try-now":          { en: "Try It Now",                    ar: "جرّبه الآن" },
        "class-annual-crop":        { en: "Annual Crop",                   ar: "محاصيل موسمية" },
        "class-annual-crop-sub":    { en: "Seasonal farming",              ar: "زراعة موسمية" },
        "class-forest":             { en: "Forest",                        ar: "غابات" },
        "class-forest-sub":         { en: "Dense canopy",                  ar: "غطاء شجري كثيف" },
        "class-herbaceous":         { en: "Herbaceous",                    ar: "أعشاب" },
        "class-herbaceous-sub":     { en: "Wild grassland",                ar: "أراضٍ عشبية" },
        "class-highway":            { en: "Highway",                       ar: "طرق سريعة" },
        "class-highway-sub":        { en: "Road infrastructure",           ar: "بنية تحتية طرقية" },
        "class-industrial":         { en: "Industrial",                    ar: "مناطق صناعية" },
        "class-industrial-sub":     { en: "Factories & warehouses",        ar: "مصانع ومستودعات" },
        "class-pasture":            { en: "Pasture",                       ar: "مراعٍ" },
        "class-pasture-sub":        { en: "Grazing land",                  ar: "أراضٍ رعوية" },
        "class-permanent-crop":     { en: "Permanent Crop",                ar: "محاصيل دائمة" },
        "class-permanent-crop-sub": { en: "Orchards & vineyards",          ar: "بساتين وكروم" },
        "class-residential":        { en: "Residential",                   ar: "مناطق سكنية" },
        "class-residential-sub":    { en: "Urban housing",                 ar: "إسكان حضري" },
        "class-river":              { en: "River",                         ar: "أنهار" },
        "class-river-sub":          { en: "Flowing waterways",             ar: "مجاري مائية" },
        "class-sea-lake":           { en: "Sea / Lake",                    ar: "بحر / بحيرة" },
        "class-sea-lake-sub":       { en: "Stationary water",              ar: "مياه ساكنة" },

        // ── Landing Page — Model Stats ──
        "stats-title":              { en: "Powered by Deep Learning.",     ar: "مدعوم بالتعلّم العميق." },
        "stats-test-accuracy":      { en: "Test Accuracy",                 ar: "دقة الاختبار" },
        "stats-parameters":         { en: "Parameters",                    ar: "المعلمات" },
        "stats-training-images":    { en: "Training Images",               ar: "صور التدريب" },
        "stats-land-classes":       { en: "Land Cover Classes",            ar: "فئات الغطاء الأرضي" },
        "stats-try-observatory":    { en: "Try the Observatory",           ar: "جرّب المرصد" },
        "stats-tech-stack":         { en: "Tech Stack",                    ar: "التقنيات المستخدمة" },

        // ── Footer (shared) ──
        "footer-observatory":       { en: "Observatory",                   ar: "المرصد" },
        "footer-how-it-works":      { en: "How It Works",                  ar: "كيف يعمل" },
        "footer-classes":           { en: "Classes",                       ar: "الفئات" },
        "footer-rights":            { en: "© 2026 Abdelrahman Ehab. All rights reserved.", ar: "© ٢٠٢٦ عبدالرحمن إيهاب. جميع الحقوق محفوظة." },

        // ── Classify Page — Nav ──
        "cls-model-active":         { en: "Model Active",                  ar: "النموذج نشط" },
        "cls-hud-title":            { en: "Classification HUD",            ar: "لوحة التصنيف" },
        "cls-hud-status-idle":      { en: "AI Processing: Idle",           ar: "المعالجة: خامل" },
        "cls-hud-ready":            { en: "Ready to classify",             ar: "جاهز للتصنيف" },

        // ── Classify Page — Sidebar ──
        "cls-view-mode":            { en: "View Mode",                     ar: "وضع العرض" },
        "cls-globe":                { en: "Globe",                         ar: "الكرة الأرضية" },
        "cls-satellite":            { en: "Satellite",                     ar: "القمر الاصطناعي" },
        "cls-search-dest":          { en: "Search Destination",            ar: "البحث عن وجهة" },
        "cls-search-placeholder":   { en: "City, landmark, address...",    ar: "مدينة، معلم، عنوان..." },
        "cls-go-to-coords":         { en: "Go To Coordinates",             ar: "الذهاب إلى الإحداثيات" },
        "cls-go-to-location":       { en: "Go to Location",                ar: "الذهاب إلى الموقع" },
        "cls-realtime-hud":         { en: "Real-time HUD",                 ar: "لوحة تحكم مباشرة" },
        "cls-upload-image":         { en: "Upload Image",                  ar: "رفع صورة" },
        "cls-sample-gallery":       { en: "Sample Gallery",                ar: "معرض العينات" },
        "cls-active-arch":          { en: "Active Architecture",           ar: "البنية النشطة" },

        // ── Classify Page — Globe HUD ──
        "cls-zoom-level":           { en: "Zoom Level",                    ar: "مستوى التكبير" },
        "cls-scroll-hint":          { en: "Scroll to zoom • Drag to rotate", ar: "مرّر للتكبير • اسحب للتدوير" },
        "cls-capture-hint":         { en: "Zoom to 100% or click globe to open satellite view", ar: "كبّر إلى ١٠٠٪ أو انقر الكرة لفتح عرض القمر الاصطناعي" },
        "cls-open-satellite":       { en: "Open Live Satellite View",      ar: "فتح بث القمر الاصطناعي" },
        "cls-use-my-location":      { en: "Use My Location",               ar: "استخدم موقعي" },
        "cls-back-globe":           { en: "Back to Globe",                 ar: "العودة للكرة الأرضية" },
        "cls-live-feed":            { en: "Live Satellite Feed",           ar: "بث مباشر من القمر الاصطناعي" },
        "cls-esri-info":            { en: "ESRI World Imagery • Navigate to any location", ar: "صور ESRI العالمية • انتقل إلى أي موقع" },
        "cls-capture-classify":     { en: "Capture & Classify",            ar: "التقاط وتصنيف" },
        "cls-switching-sat":        { en: "Switching to Satellite...",      ar: "الانتقال إلى القمر الاصطناعي..." },

        // ── Classify Page — Upload Zone ──
        "cls-upload-directly":      { en: "Or upload a satellite image directly", ar: "أو ارفع صورة قمر اصطناعي مباشرة" },
        "cls-upload-supports":      { en: "Supports JPG, PNG • Resized to 64x64 internally", ar: "يدعم JPG و PNG • يُعاد تحجيمه إلى 64×64 داخلياً" },
        "cls-classify":             { en: "Classify",                      ar: "تصنيف" },
        "cls-clear":                { en: "Clear",                         ar: "مسح" },
        "cls-classifying":          { en: "Classifying...",                ar: "جارٍ التصنيف..." },

        // ── Classify Page — Results ──
        "cls-empty-title":          { en: "Zoom into Earth & open satellite view", ar: "كبّر على الأرض وافتح عرض القمر الصناعي" },
        "cls-empty-sub":            { en: "Capture real satellite imagery to classify", ar: "التقط صور أقمار اصطناعية حقيقية للتصنيف" },
        "cls-detected":             { en: "Detected Land Cover",           ar: "الغطاء الأرضي المكتشف" },
        "cls-confidence":           { en: "Confidence",                    ar: "الثقة" },
        "cls-full-breakdown":       { en: "Full Classification Breakdown", ar: "تفصيل التصنيف الكامل" },
        "cls-confidence-dist":      { en: "Confidence Distribution",       ar: "توزيع الثقة" },
        "cls-log":                  { en: "Classification Log",            ar: "سجل التصنيف" },
        "cls-clear-log":            { en: "Clear",                         ar: "مسح" },
        "cls-no-history":           { en: "No classifications yet",        ar: "لا توجد تصنيفات بعد" },
        "cls-captured-img":         { en: "Captured Satellite Image",      ar: "صورة القمر الاصطناعي الملتقطة" },
        "cls-quick-test":           { en: "Quick Test — Sample Gallery",   ar: "اختبار سريع — معرض العينات" },
        "cls-load-samples":         { en: "Load test samples from dataset",ar: "تحميل عينات اختبار من مجموعة البيانات" },

        // ── Classify Page — Mobile ──
        "cls-search-place":         { en: "Search any place...",           ar: "ابحث عن أي مكان..." },
        "cls-my-location":          { en: "My Location",                   ar: "موقعي" },
        "cls-10-classes":           { en: "10 Classes",                    ar: "١٠ فئات" },
        "cls-footer-copy":          { en: "© 2026 Abdelrahman Ehab — EuroSAT Land Cover Classification", ar: "© ٢٠٢٦ عبدالرحمن إيهاب — تصنيف الغطاء الأرضي EuroSAT" },
    };

    // ─── Core Engine ────────────────────────────────────────────────────────────

    function getSavedLang() {
        return localStorage.getItem(STORAGE_KEY) || 'en';
    }

    function setLang(lang) {
        localStorage.setItem(STORAGE_KEY, lang);
    }

    /**
     * Apply the language across the entire page.
     * Text-only swap — layout stays LTR always.
     */
    function applyLanguage(lang) {
        const html = document.documentElement;

        // 1. Set lang attribute only (NO dir change — layout stays LTR)
        html.setAttribute('lang', lang);

        // 2. Swap all data-i18n text nodes
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] && dict[key][lang]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = dict[key][lang];
                } else {
                    el.textContent = dict[key][lang];
                }
            }
        });

        // 3. Update toggle button states
        document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
            const btnLang = btn.getAttribute('data-lang');
            if (btnLang === lang) {
                btn.classList.add('bg-gradient-to-r', 'from-primary', 'to-primary-container', 'text-white', 'shadow-lg');
                btn.classList.remove('text-slate-400');
            } else {
                btn.classList.remove('bg-gradient-to-r', 'from-primary', 'to-primary-container', 'text-white', 'shadow-lg');
                btn.classList.add('text-slate-400');
            }
        });

        setLang(lang);

        // 4. Notify other scripts (carousel, legacy-tabs) to re-render
        window.dispatchEvent(new CustomEvent('langChanged', { detail: { lang } }));
    }

    /**
     * Create and inject toggle button HTML at a target container.
     */
    function injectToggle(container) {
        if (!container) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-center bg-surface-container-high rounded-xl p-0.5 border border-outline-variant/20 shadow-lg';
        wrapper.innerHTML = `
            <button class="lang-toggle-btn px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all duration-300" data-lang="en">EN</button>
            <button class="lang-toggle-btn px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all duration-300" data-lang="ar">عربي</button>
        `;

        wrapper.querySelectorAll('.lang-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.getAttribute('data-lang');
                applyLanguage(lang);
            });
        });

        container.appendChild(wrapper);
    }

    // ─── Initialization ─────────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', () => {
        // Inject toggles into designated containers
        document.querySelectorAll('[data-lang-toggle]').forEach(container => {
            injectToggle(container);
        });

        // Apply saved language
        applyLanguage(getSavedLang());
    });

    // Expose globally for programmatic access
    window.GlobeClassI18n = { applyLanguage, dict, getSavedLang };
})();
