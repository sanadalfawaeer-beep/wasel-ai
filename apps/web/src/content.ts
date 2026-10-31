import {
  Accessibility,
  Armchair,
  BellRing,
  Bluetooth,
  Bus,
  DoorOpen,
  Ear,
  Eye,
  Footprints,
  Hand,
  Headphones,
  LifeBuoy,
  MapPin,
  MessageSquare,
  Navigation,
  Radio,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Vibrate,
  Volume2,
  type LucideIcon,
} from 'lucide-react';

export type Lang = 'ar' | 'en';
export type Mode = 'visual' | 'hearing';
export type SeatStatus = 'available' | 'occupied' | 'accessible';

export interface Localized {
  ar: string;
  en: string;
}

export const l = (ar: string, en: string): Localized => ({ ar, en });
export const L = (value: Localized, lang: Lang): string => value[lang];

export const navItems = [
  { id: 'planner', label: l('خطط رحلتك', 'Plan a trip') },
  { id: 'journey', label: l('الرحلة', 'Trip') },
  { id: 'seats', label: l('المقاعد', 'Seats') },
  { id: 'communication', label: l('التواصل', 'Chat') },
  { id: 'survey', label: l('الاستبيان', 'Survey') },
];

export const ui = {
  brandTag: l('النقل الذكي والمتاح للجميع — الأردن', 'Smart, accessible transport — Jordan'),
  skip: l('تخطَّ إلى المحتوى', 'Skip to content'),
  language: l('اللغة', 'Language'),
  arabic: l('العربية', 'Arabic'),
  english: l('English', 'English'),
  reduceMotion: l('تقليل الحركة', 'Reduce motion'),
  motionOn: l('تشغيل الحركة', 'Enable motion'),
  motionOff: l('تقليل الحركة', 'Reduce motion'),
  minutesShort: l('د', 'min'),
  modeSample: l(
    'المحطة على بعد 50 مترًا جهة اليمين. الباص 101 وصل الآن.',
    'The station is 50 m to your right. Bus 101 has arrived.',
  ),
  prototype: l('نموذج أولي', 'Prototype'),
  future: l('مقترح مستقبلي', 'Future proposal'),
  close: l('إغلاق', 'Close'),

  heroEyebrow: l('مشروع جامعي ابتكاري لتعزيز إتاحة النقل العام في الأردن', 'A university project for accessible public transport in Jordan'),
  heroTitle: l('ACCESSIBLE BRT', 'ACCESSIBLE BRT'),
  heroSubtitle: l('تنقّل أسهل، استقلالية أكبر، ووصول للجميع', 'Easier mobility, greater independence, access for all'),
  heroQuote: l(
    'نحو تجربة نقل عام أكثر سهولة وشمولًا، تُمكّن الأشخاص ذوي الإعاقة البصرية والسمعية من التنقل بثقة واستقلالية عبر شبكة الباص سريع التردد الأردني.',
    'Towards a more accessible and inclusive public transport experience, empowering people with visual and hearing disabilities to move confidently and independently across Jordan’s Bus Rapid Transit network.',
  ),
  ctaExplore: l('اكتشف المشروع', 'Explore the project'),
  ctaTry: l('جرّب الرحلة', 'Try the journey'),
  ctaListen: l('استمع للتقديم', 'Listen to the intro'),
  heroCardDemo: l('محاكاة', 'Simulation'),
  modeBarLabel: l('وضع الإتاحة', 'Accessibility mode'),
  modeVisualShort: l('بصري', 'Visual'),
  modeHearingShort: l('سمعي', 'Hearing'),
  statIndependence: l('استقلالية في التنقل', 'Independent mobility'),
  statAi: l('ذكاء اصطناعي داعم', 'Supportive AI'),
  statIot: l('حساسات مقاعد ذكية', 'Smart seat sensors'),
  statModes: l('أنماط إتاحة', 'Accessibility modes'),
  heroCardTitle: l('BRT 102 · قادم الآن', 'BRT 102 · arriving'),
  heroCardMeta: l('الدوار السابع · 4 دقائق · 5 مقاعد', '7th Circle · 4 min · 5 seats'),
  heroVisualCaption: l('محطة الباص السريع — عمّان/الزرقاء', 'BRT station — Amman/Zarqa'),
  heroVisualSub: l('ربط تقني شامل للمحطات الذكية والحافلات الحمراء المجهزة', 'Connected smart stations and equipped red buses'),

  planEyebrow: l('مخطط الرحلات', 'Trip planner'),
  planTitle: l('إلى أين تريد الذهاب؟', 'Where do you want to go?'),
  planDesc: l(
    'اكتب وجهتك في عمّان وسنعرض لك خط الباص، موقف الصعود، موعد الوصول، والمقاعد المتاحة.',
    'Enter an Amman destination and we’ll show the bus line, boarding stop, arrival time, and available seats.',
  ),
  planLabel: l('الوجهة', 'Destination'),
  planPlaceholder: l('مثال: سيتي مول، وسط البلد، عبدون', 'e.g. City Mall, Downtown, Abdoun'),
  planButton: l('ابحث عن الباص', 'Find my bus'),
  planPlanning: l('أبحث عن أفضل خط…', 'Finding the best line…'),
  planQuick: l('وجهات سريعة', 'Quick destinations'),
  planResults: l('الخيارات المتاحة', 'Available options'),
  planWalk: l('مشي', 'Walk'),
  planRide: l('الباص', 'Ride'),
  planStops: l('محطات', 'stops'),
  planSeats: l('مقاعد متاحة', 'seats available'),
  planStanding: l('وقوف', 'Standing'),
  planNext: l('الباص القادم', 'Next bus'),
  planArrive: l('وقت الوصول', 'Arrival'),
  planPrototype: l('بيانات تجريبية', 'Prototype data'),
  planAria: l('نتائج رحلة الباص', 'Bus trip results'),
  planNoResult: l('لا توجد نتائج. جرّب وجهة أخرى.', 'No results. Try another destination.'),
  planDefault: l('سيتي مول', 'City Mall'),

  aboutEyebrow: l('عن المشروع التطويري', 'About the project'),
  aboutTitle: l('نحو نقل عام بلا حواجز', 'Towards barrier-free public transport'),
  aboutBody: l(
    'ACCESSIBLE BRT نظام ذكي مصمم لتيسير تجربة النقل العام، وبالأخص شبكة الباص سريع التردد في الأردن، للأشخاص المكفوفين وضعاف البصر والصم وضعاف السمع. يدعم النظام الرحلة كاملة: التوجيه إلى المحطة، تحديد الباص الصحيح، الصعود، اكتشاف المقعد، التواصل مع السائق عبر الذكاء الاصطناعي، والتنبيه قبل الوصول.',
    'ACCESSIBLE BRT is a smart system designed to improve public transport — specifically Jordan’s Bus Rapid Transit network — for blind, low-vision, Deaf, and hard-of-hearing people. It supports the whole journey: guidance to the station, identifying the right bus, boarding, finding a seat, communicating with the driver through AI, and alerts before arrival.',
  ),
  valuesTitle: l('قيم المشروع', 'Project values'),
  values: [
    {
      icon: MapPin,
      title: l('سهولة الوصول', 'Accessibility'),
      body: l('معلومات نقل متعددة الحواس تتكيف مع مختلف الاحتياجات.', 'Multi-sensory transit information that adapts to different needs.'),
    },
    {
      icon: Navigation,
      title: l('الاستقلالية', 'Independence'),
      body: l('تمكين الراكب من إتمام رحلته بأقل اعتماد ممكن على الآخرين.', 'Enable riders to complete their journey with minimal dependence on others.'),
    },
    {
      icon: Hand,
      title: l('الشمولية', 'Inclusion'),
      body: l('حلول تقنية تراعي تنوع القدرات الفردية بدقة وكفاءة.', 'Technology that respects the full range of individual abilities.'),
    },
  ],

  featuresEyebrow: l('منظومة التقنيات الذكية', 'Smart technology stack'),
  featuresTitle: l('مميزات نظام ACCESSIBLE BRT', 'ACCESSIBLE BRT features'),
  featuresDesc: l('حزمة متكاملة من الحلول الرقمية وأدوات الذكاء الاصطناعي لرحلة سلسة وآمنة.', 'A complete set of digital solutions and AI tools for a smooth, safe journey.'),
  featuresLegend: l('النموذج الأولي: منفّذ داخل هذه المنصة التجريبية. مقترح مستقبلي: ميزة مقترحة للتطوير.', 'Prototype: working in this demo. Future proposal: planned for further development.'),
  featureListen: l('استمع للشرح', 'Listen to this feature'),

  journeyEyebrow: l('مراحل رحلة الراكب', 'The rider journey'),
  journeyTitle: l('الرحلة', 'Trip'),
  journeyDesc: l('خطوات تفاعلية متصلة من اختيار الوجهة حتى الوصول.', 'Seven connected steps, from choosing a destination to arrival.'),
  journeyStep: l('الخطوة', 'Step'),
  journeyPrev: l('السابق', 'Previous'),
  journeyNext: l('التالي', 'Next'),
  journeyListen: l('استمع للشرح', 'Listen'),
  journeyVibrate: l('وميض واهتزاز', 'Flash & vibrate'),
  journeyPhoneTitle: l('BRT 102 · محاكاة', 'BRT 102 · simulation'),
  journeyPhoneMeta: l('محاكاة الاتصال بشاشة السائق', 'Simulated driver-screen link'),
  journeyAudio: l('إرشاد صوتي', 'Audio guidance'),
  journeyCaptions: l('نص فوري', 'Live captions'),
  journeyStepDone: l('تم', 'Done'),

  modesEyebrow: l('أنماط التصفح والخدمة', 'Service modes'),
  modesTitle: l('أنماط الإتاحة المخصصة', 'Custom accessibility modes'),
  modesDesc: l('اختر النمط المناسب لاحتياجاتك لتجربة فورية داخل المنصة.', 'Choose the mode that fits your needs and try it instantly.'),
  modeTry: l('جرّب النمط', 'Try this mode'),
  modeVisualTitle: l('وضع المساعدة البصرية', 'Visual assistance mode'),
  modeVisualFor: l('مخصص للأشخاص المكفوفين وضعاف البصر', 'For blind and low-vision riders'),
  modeVisualFeatures: [
    l('توجيه صوتي شامل وإقران مع قارئات الشاشة.', 'Full voice guidance and screen-reader support.'),
    l('تحويل كامل للنصوص إلى كلام واضح (Text-to-Speech).', 'Complete Text-to-Speech.'),
    l('قراءة صوتية لمواقع المقاعد الخالية في الحافلة.', 'Spoken seat availability inside the bus.'),
    l('تنبيهات صوتية فورية قبل الوصول بـ 300 متر.', 'Audio alerts 300 m before arrival.'),
  ],
  modeHearingTitle: l('وضع المساعدة السمعية', 'Hearing assistance mode'),
  modeHearingFor: l('مخصص للأشخاص الصم وضعاف السمع', 'For Deaf and hard-of-hearing riders'),
  modeHearingFeatures: [
    l('تحويل كلام السائق إلى نص فوري (Speech-to-Text).', 'Speech-to-Text for the driver’s voice.'),
    l('تنبيهات بصرية وامضة شديدة التباين.', 'High-contrast flashing visual alerts.'),
    l('تنبيه اهتزازي للهاتف عند الوصول (Haptic Feedback).', 'Haptic phone feedback on arrival.'),
    l('رسائل جاهزة وسريعة للتواصل مع السائق.', 'Quick preset messages for the driver.'),
  ],

  seatsEyebrow: l('محاكاة الحساسات الذكية', 'Smart sensor simulation'),
  seatsTitle: l('المقاعد', 'Seats'),
  seatsDesc: l('مخطط بصري لهيكل الباص يعرض حالة الحساسات في الوقت الفعلي. اضغط على أي مقعد لسماع حالته.', 'A visual bus interior showing sensor status. Select a seat to hear its status.'),
  seatsDriver: l('كابينة السائق', 'Driver cabin'),
  seatsDoor: l('الأبواب الأمامية ومنطقة الكراسي المتحركة', 'Front doors & wheelchair area'),
  seatsFront: l('القسم الأمامي', 'Front section'),
  seatsMiddle: l('القسم الأوسط', 'Middle section'),
  seatsRear: l('القسم الخلفي', 'Rear section'),
  seatsAvailable: l('متاح', 'Available'),
  seatsOccupied: l('مشغول', 'Occupied'),
  seatsAccessible: l('مخصص لذوي الإعاقة', 'Accessible / priority'),
  seatsAvailableCount: l('مقعد متاح', 'available seats'),
  seatsAccessibleCount: l('مقعد مخصص', 'accessible seat'),
  seatsNote: l('بيانات افتراضية لشرح النموذج الأولي، وليست قراءة حية من باص أردني.', 'Simulated data for the prototype, not a live reading from an Amman bus.'),
  seatsSelected: l('تم اختيار المقعد', 'Selected seat'),
  seatsReadAll: l('قراءة المقاعد صوتاً', 'Read seats aloud'),
  seatsNone: l('لا توجد مقاعد متاحة حالياً.', 'No seats are available right now.'),
  seatsPipelineTitle: l('مسار بيانات الحساس', 'Sensor data pipeline'),
  seatsPipeline: [
    l('حساس المقعد', 'Seat sensor'),
    l('المتحكم الإلكتروني', 'Electronic controller'),
    l('معالجة سحابية', 'Cloud processing'),
    l('واجهة صوتية ومرئية', 'Audio & visual UI'),
  ],

  commEyebrow: l('التواصل المتبادل بالذكاء الاصطناعي', 'AI-powered two-way communication'),
  commTitle: l('التواصل مع السائق', 'Driver chat'),
  commDesc: l('تحويل الصوت إلى نص والنص إلى صوت لتسهيل التفاهم أثناء الرحلة.', 'Speech-to-text and text-to-speech keep rider and driver understood.'),
  commActive: l('قناة نشطة: حافلة BRT 102', 'Active channel: BRT 102'),
  commAi: l('معالجة الذكاء الاصطناعي: تعمل', 'AI processing: active'),
  commConnected: l('متصل الآن بشاشة السائق', 'Connected to the driver screen'),
  commRider: l('الراكب', 'Rider'),
  commDriver: l('السائق', 'Driver'),
  commQuick: l('رسائل سريعة بنقرة واحدة', 'One-tap quick messages'),
  commPlaceholder: l('اكتب رسالة للسائق…', 'Type a message to the driver…'),
  commSend: l('إرسال', 'Send'),
  commMic: l('تحدث', 'Speak'),
  commListening: l('أستمع…', 'Listening…'),
  commThinking: l('الذكاء الاصطناعي يجهّز الرد…', 'AI is preparing a reply…'),
  commMicUnsupported: l('التعرف على الصوت غير مدعوم في هذا المتصفح. استخدم النص.', 'Speech recognition is not supported in this browser. Use text.'),
  commPrototype: l('محاكاة الردود', 'Simulated replies'),
  commRiderFallback: l('سأبلغ السائق بوجود راكب يحتاج إلى مساعدة.', 'I’ll let the driver know a rider needs assistance.'),
  commWelcome: l('مرحبًا بك في BRT 102. كيف يمكنني مساعدتك؟', 'Welcome aboard BRT 102. How can I help?'),
  commReplySeat: l('يوجد مقعد فارغ على بُعد خطوتين جهة اليسار. سأنتظر حتى تجلس.', 'There is an empty seat two steps to your left. I’ll wait until you are seated.'),
  commReplyStation: l('المحطة القادمة هي مجمع الشمال. سأبقي الأبواب مفتوحة عند وصولك.', 'The next station is the North Complex. I’ll keep the doors open when we arrive.'),
  commReplyDefault: l('أنا هنا للمساعدة. سأنتظرك حتى تكمل الصعود.', 'I’m here to help. I’ll wait until you finish boarding.'),

  impactEyebrow: l('الأثر المجتمعي والتطويري', 'Community impact'),
  impactTitle: l('أثر مشروع ACCESSIBLE BRT', 'The impact of ACCESSIBLE BRT'),
  impactDesc: l('رؤية تطبيقية تحوّل التحديات اليومية إلى فرص للتنقل الحر والآمن.', 'Turning daily barriers into opportunities for free, safe mobility.'),

  surveyEyebrow: l('شاركنا رأيك', 'Share your feedback'),
  surveyTitle: l('الاستبيان', 'Survey'),
  surveyDesc: l('آراؤكم هي الحجر الأساس في إثراء هذا المشروع الجامعي.', 'Your feedback shapes this university project.'),
  surveyName: l('الاسم (اختياري)', 'Name (optional)'),
  surveyCategory: l('الفئة الفاعلة', 'Rider category'),
  surveyRating: l('تقييمك لفكرة ومميزات المشروع', 'Rate the project idea and features'),
  surveyNotes: l('الملاحظات والاقتراحات', 'Notes and suggestions'),
  surveySubmit: l('إرسال الاستبيان', 'Submit survey'),
  surveySuccess: l('شكرًا لك! تم تسجيل ملاحظاتك محليًا.', 'Thank you! Your feedback has been saved locally.'),
  surveyLocal: l('نموذج أولي: تُحفظ الإجابات في هذا المتصفح فقط.', 'Prototype: responses stay in this browser only.'),
  surveyCategoryOptions: [
    l('شخص كفيف أو ضعيف البصر', 'Blind or low-vision rider'),
    l('شخص أصم أو ضعيف السمع', 'Deaf or hard-of-hearing rider'),
    l('مرافق أو أفراد العائلة', 'Companion or family member'),
    l('مشغل نقل أو جهة أكاديمية', 'Transit operator or academic'),
  ],

  footerLinks: l('روابط التنقل السريع', 'Quick links'),
  footerDisclaimer: l(
    'هذه المنصة نموذج عمل جامعي ولا تعبر رسميًا عن أي جهة حكومية أو مشغل تجاري للباص السريع في الأردن.',
    'This platform is a university project and does not officially represent any government entity or commercial BRT operator in Jordan.',
  ),
  footerProject: l('مشروع تخرج جامعي — المملكة الأردنية الهاشمية', 'University graduation project — Hashemite Kingdom of Jordan'),
  footerCollege: l('كلية الهندسة وتكنولوجيا المعلومات', 'College of Engineering and Information Technology'),
  footerMajor: l('الذكاء الاصطناعي وتصميم الإتاحة الرقمية', 'AI and Digital Accessibility Design'),
  footerRights: l('© 2026 ACCESSIBLE BRT — جميع الحقوق محفوظة', '© 2026 ACCESSIBLE BRT — All rights reserved'),
  footerMade: l('صُمم بحب وإتاحة للجميع', 'Designed with love and accessibility for all'),
  footerTeam: l('فريق العمل والإشراف', 'Team & supervision'),
  footerTeamBody: l('إعداد وتصميم: فريق مشروع ACCESSIBLE BRT — بإشراف أكاديمي من كلية الهندسة وتكنولوجيا المعلومات.', 'Prepared and designed by the ACCESSIBLE BRT project team, with academic supervision from the College of Engineering and Information Technology.'),
};

export interface Feature {
  id: string;
  icon: LucideIcon;
  title: Localized;
  body: Localized;
  badge: 'prototype' | 'future';
}

export const features: Feature[] = [
  {
    id: 'navigation',
    icon: Navigation,
    title: l('التوجيه إلى المحطات', 'Station navigation'),
    body: l('مساعدة المستخدم في تحديد أقرب محطة والوصول إليها بإرشادات صوتية واهتزازية.', 'Find the nearest BRT station and reach it with audio and haptic guidance.'),
    badge: 'prototype',
  },
  {
    id: 'identification',
    icon: ScanLine,
    title: l('تحديد الباص المناسب', 'Bus identification'),
    body: l('عرض رقم الباص الأحمر واتجاه الرحلة والموعد الدقيق للتأكد من المركبة الصحيحة.', 'Show the red bus number, direction, and exact arrival so riders board the right vehicle.'),
    badge: 'prototype',
  },
  {
    id: 'communication',
    icon: MessageSquare,
    title: l('التواصل الذكي مع السائق', 'AI driver communication'),
    body: l('تحويل الصوت إلى نص للسائق، ورسائل السائق إلى صوت أو اهتزازات فورية للراكب.', 'Speech-to-text for the driver, and driver messages as speech or haptics for the rider.'),
    badge: 'prototype',
  },
  {
    id: 'seats',
    icon: Armchair,
    title: l('اكتشاف المقاعد المتاحة', 'Seat sensors'),
    body: l('حساسات وزن وضغط مع تحكم إلكتروني لبيان الكراسي الفارغة داخل الباص.', 'Weight and pressure sensors with electronic control reveal empty seats inside the bus.'),
    badge: 'prototype',
  },
  {
    id: 'indoor',
    icon: Bluetooth,
    title: l('التوجيه داخل الباص', 'Indoor bus navigation'),
    body: l('توجيه من باب الباص حتى المقعد المتاح باستخدام البلوتوث الذكي (Beacons).', 'Guide a blind rider from the door to an available seat using Bluetooth beacons.'),
    badge: 'future',
  },
  {
    id: 'realtime',
    icon: Radio,
    title: l('معلومات الرحلة المباشرة', 'Real-time trip info'),
    body: l('متابعة المحطات القادمة ووقت التوقف والتحديثات الاستثنائية بوضوح تام.', 'Upcoming stations, stop time, and disruptions with complete clarity.'),
    badge: 'prototype',
  },
  {
    id: 'alerts',
    icon: Vibrate,
    title: l('التنبيهات المرئية والاهتزازية', 'Visual & haptic alerts'),
    body: l('نبضات اهتزازية وإشارات ضوئية للصم وضعاف السمع للتنبيه بموعد النزول.', 'Vibration and high-contrast light cues for Deaf and hard-of-hearing riders before their stop.'),
    badge: 'prototype',
  },
  {
    id: 'custom',
    icon: SlidersHorizontal,
    title: l('أنماط الإتاحة المخصصة', 'Custom accessibility modes'),
    body: l('تبديل بنقرة واحدة بين وضع المساعدة البصرية ووضع المساعدة السمعية.', 'Switch between visual assistance and hearing assistance with one tap.'),
    badge: 'prototype',
  },
  {
    id: 'assistance',
    icon: LifeBuoy,
    title: l('طلب المساعدة الفورية', 'Emergency assistance'),
    body: l('زر طوارئ سريع لإبلاغ مشغلي المحطة أو السائق بوجود راكب يحتاج مساعدة.', 'A fast emergency button to alert station staff or the driver that a rider needs help.'),
    badge: 'future',
  },
];

export interface JourneyStep {
  id: string;
  icon: LucideIcon;
  title: Localized;
  body: Localized;
  sample: Localized;
}

export const journeySteps: JourneyStep[] = [
  {
    id: 'destination',
    icon: MapPin,
    title: l('اختيار الوجهة', 'Choose a destination'),
    body: l('يحدد الراكب وجهته من واجهة سهلة أو بأوامر صوتية.', 'The rider chooses a destination through a simple interface or voice commands.'),
    sample: l('«أريد الذهاب إلى مجمع المحطة — الباص السريع»', '“I want to go to the North Complex — BRT.”'),
  },
  {
    id: 'station',
    icon: Footprints,
    title: l('الوصول إلى المحطة', 'Reach the station'),
    body: l('يساعد النظام على تحديد المحطة بدقة وتفادي العوائق.', 'The system locates the station precisely and helps avoid obstacles.'),
    sample: l('«المحطة على بعد 50 مترًا جهة اليمين، اتبع المسار الملموس.»', '“The station is 50 m to the right; follow the tactile path.”'),
  },
  {
    id: 'bus',
    icon: Bus,
    title: l('تحديد الباص', 'Identify the bus'),
    body: l('يعرض النظام الباصات القادمة واتجاهها لمنع الصعود الخاطئ.', 'Shows approaching buses and directions to prevent boarding the wrong one.'),
    sample: l('«الباص الأحمر القادم رقم 101، متجه إلى صويلح، وصل الآن.»', '“The next red bus is 101, heading to Sweileh; it has arrived.”'),
  },
  {
    id: 'boarding',
    icon: DoorOpen,
    title: l('الصعود إلى الباص', 'Board the bus'),
    body: l('تنبيهات صوتية واهتزازية فور فتح الأبواب لصعود آمن.', 'Audio and haptic alerts as the doors open for a safe boarding.'),
    sample: l('«الأبواب تُفتح الآن، انتبه للفجوة الصغيرة.»', '“The doors are opening now; mind the small gap.”'),
  },
  {
    id: 'communication',
    icon: MessageSquare,
    title: l('التواصل والتوجيه', 'Communicate & navigate'),
    body: l('تنسيق مباشر مع السائق وتتبع دقيق للمحطات المتبقية.', 'Direct coordination with the driver and precise tracking of remaining stops.'),
    sample: l('«تم إبلاغ السائق بوجود راكب كفيف. السائق: مرحبًا بك.»', '“The driver has been told a blind rider is boarding. Driver: Welcome.”'),
  },
  {
    id: 'seat',
    icon: Armchair,
    title: l('معرفة المقاعد', 'Find a seat'),
    body: l('قراءة خريطة المقاعد الخالية صوتيًا ومساعدة الراكب على الجلوس بأمان.', 'Read the empty-seat map aloud and help the rider sit safely.'),
    sample: l('«مقعد فارغ على بُعد خطوتين جهة اليسار.»', '“An empty seat is two steps to your left.”'),
  },
  {
    id: 'arrival',
    icon: BellRing,
    title: l('الوصول إلى الوجهة', 'Arrive at the destination'),
    body: l('إشعار اهتزازي وصوتي قبل المحطة المستهدفة للاستعداد للنزول.', 'A haptic and audio alert before the target stop so the rider can prepare.'),
    sample: l('«وصلت إلى محطتك بنجاح. نتمنى لك رحلة طيبة.»', '“You have reached your stop. Have a nice trip.”'),
  },
];

export interface ModeContent {
  id: Mode;
  icon: LucideIcon;
  title: Localized;
  forWhom: Localized;
  features: Localized[];
  button: Localized;
}

export const modes: ModeContent[] = [
  {
    id: 'visual',
    icon: Eye,
    title: ui.modeVisualTitle,
    forWhom: ui.modeVisualFor,
    features: ui.modeVisualFeatures,
    button: l('تجربة صوتية للوضع البصري', 'Try the audio demo'),
  },
  {
    id: 'hearing',
    icon: Ear,
    title: ui.modeHearingTitle,
    forWhom: ui.modeHearingFor,
    features: ui.modeHearingFeatures,
    button: l('تجربة وميض واهتزاز الوضع السمعي', 'Try flash & vibration'),
  },
];

export interface Seat {
  id: string;
  status: SeatStatus;
}

export interface SeatSection {
  id: string;
  title: Localized;
  seats: Seat[];
}

export const seatSections: SeatSection[] = [
  {
    id: 'front',
    title: ui.seatsFront,
    seats: [
      { id: 'F1', status: 'available' },
      { id: 'F2', status: 'occupied' },
      { id: 'F3', status: 'accessible' },
      { id: 'F4', status: 'occupied' },
    ],
  },
  {
    id: 'middle',
    title: ui.seatsMiddle,
    seats: [
      { id: 'M1', status: 'occupied' },
      { id: 'M2', status: 'available' },
      { id: 'M3', status: 'occupied' },
      { id: 'M4', status: 'occupied' },
    ],
  },
  {
    id: 'rear',
    title: ui.seatsRear,
    seats: [
      { id: 'R1', status: 'available' },
      { id: 'R2', status: 'available' },
      { id: 'R3', status: 'available' },
      { id: 'R4', status: 'occupied' },
    ],
  },
];

export const impactItems: Array<{ icon: LucideIcon; title: Localized; body: Localized }> = [
  {
    icon: Navigation,
    title: l('تعزيز الاستقلالية الكاملة', 'Full independence'),
    body: l('تمكين الأشخاص ذوي الإعاقات البصرية والسمعية من التنقل دون مرافق دائم.', 'Enable riders with visual and hearing disabilities to travel without a permanent companion.'),
  },
  {
    icon: Headphones,
    title: l('تسهيل الوصول للمعلومات', 'Access to information'),
    body: l('بيانات المواعيد والمحطات في الوقت الفعلي بوسائل متعددة الحواس.', 'Real-time schedule and station data through multiple senses.'),
  },
  {
    icon: MessageSquare,
    title: l('تحسين التواصل الإنساني', 'Better human communication'),
    body: l('جسر فهم سلس بين الركاب وسائقي الباص السريع.', 'A smooth bridge of understanding between riders and BRT drivers.'),
  },
  {
    icon: Armchair,
    title: l('معرفة المقاعد الشاغرة', 'Know the empty seats'),
    body: l('تقليل البحث العشوائي داخل الحافلة عبر تحديد المقعد مسبقًا.', 'Reduce random searching inside the bus by finding a seat in advance.'),
  },
  {
    icon: ShieldCheck,
    title: l('رفع الأمان والثقة', 'Safety and trust'),
    body: l('إشعارات مستمرة تمنح الراكب الطمأنينة طوال الرحلة.', 'Continuous alerts give the rider confidence throughout the trip.'),
  },
  {
    icon: Sparkles,
    title: l('دعم المدن الذكية', 'Smart cities'),
    body: l('نموذج جامعي قابل للتبني في مشاريع النقل الأردنية المستقبلية.', 'A university prototype ready to inform future Jordanian transit projects.'),
  },
];

export interface TripOption {
  id: string;
  line: string;
  color: string;
  board: Localized;
  alight: string;
  walk: number;
  ride: number;
  stops: number;
  seats: number | null;
  occupancy: 'seats' | 'standing';
  next: number;
  arrivalAt: string;
}

export const quickDestinations = [
  l('سيتي مول', 'City Mall'),
  l('وسط البلد', 'Downtown'),
  l('عبدون', 'Abdoun'),
  l('صويلح', 'Sweileh'),
  l('المدينة الرياضية', 'Sports City'),
];

type TripSeed = Omit<TripOption, 'alight' | 'arrivalAt'>;

const tripSeeds: Array<{ match: string[]; trips: TripSeed[] }> = [
  {
    match: ['city mall', 'سيتي مول'],
    trips: [
      {
        id: 'brt102',
        line: 'BRT 102',
        color: '#B0002A',
        board: l('موقف الدوار السابع', '7th Circle Station'),
        walk: 5,
        ride: 12,
        stops: 6,
        seats: 5,
        occupancy: 'seats',
        next: 4,
      },
      {
        id: 'bus101',
        line: 'Amman Bus 101',
        color: '#B45309',
        board: l('مجمع صويلح', 'Sweileh Terminal'),
        walk: 7,
        ride: 20,
        stops: 9,
        seats: null,
        occupancy: 'standing',
        next: 9,
      },
      {
        id: 'brt103',
        line: 'BRT 103',
        color: '#1D4ED8',
        board: l('المدينة الرياضية', 'Sports City'),
        walk: 4,
        ride: 9,
        stops: 4,
        seats: 2,
        occupancy: 'seats',
        next: 6,
      },
    ],
  },
  {
    match: ['downtown', 'وسط البلد'],
    trips: [
      {
        id: 'bus100',
        line: 'Amman Bus 100',
        color: '#0F766E',
        board: l('موقف الدوار السابع', '7th Circle Station'),
        walk: 4,
        ride: 14,
        stops: 7,
        seats: 8,
        occupancy: 'seats',
        next: 3,
      },
      {
        id: 'brt102',
        line: 'BRT 102',
        color: '#B0002A',
        board: l('موقف الدوار السابع', '7th Circle Station'),
        walk: 5,
        ride: 10,
        stops: 5,
        seats: 3,
        occupancy: 'seats',
        next: 6,
      },
      {
        id: 'brt103',
        line: 'BRT 103',
        color: '#1D4ED8',
        board: l('المدينة الرياضية', 'Sports City'),
        walk: 6,
        ride: 16,
        stops: 8,
        seats: null,
        occupancy: 'standing',
        next: 8,
      },
    ],
  },
  {
    match: ['abdoun', 'عبدون'],
    trips: [
      {
        id: 'brt103',
        line: 'BRT 103',
        color: '#1D4ED8',
        board: l('المدينة الرياضية', 'Sports City'),
        walk: 4,
        ride: 8,
        stops: 4,
        seats: 4,
        occupancy: 'seats',
        next: 5,
      },
      {
        id: 'bus101',
        line: 'Amman Bus 101',
        color: '#B45309',
        board: l('مجمع صويلح', 'Sweileh Terminal'),
        walk: 9,
        ride: 22,
        stops: 10,
        seats: null,
        occupancy: 'standing',
        next: 8,
      },
      {
        id: 'brt102',
        line: 'BRT 102',
        color: '#B0002A',
        board: l('موقف الدوار السابع', '7th Circle Station'),
        walk: 6,
        ride: 11,
        stops: 5,
        seats: 2,
        occupancy: 'seats',
        next: 7,
      },
    ],
  },
  {
    match: ['sweileh', 'صويلح'],
    trips: [
      {
        id: 'bus101',
        line: 'Amman Bus 101',
        color: '#B45309',
        board: l('مجمع صويلح', 'Sweileh Terminal'),
        walk: 3,
        ride: 6,
        stops: 3,
        seats: 6,
        occupancy: 'seats',
        next: 3,
      },
      {
        id: 'brt102',
        line: 'BRT 102',
        color: '#B0002A',
        board: l('موقف الدوار السابع', '7th Circle Station'),
        walk: 5,
        ride: 9,
        stops: 4,
        seats: 1,
        occupancy: 'seats',
        next: 5,
      },
      {
        id: 'brt103',
        line: 'BRT 103',
        color: '#1D4ED8',
        board: l('المدينة الرياضية', 'Sports City'),
        walk: 10,
        ride: 18,
        stops: 8,
        seats: null,
        occupancy: 'standing',
        next: 10,
      },
    ],
  },
  {
    match: ['sports city', 'المدينة الرياضية'],
    trips: [
      {
        id: 'brt103',
        line: 'BRT 103',
        color: '#1D4ED8',
        board: l('المدينة الرياضية', 'Sports City'),
        walk: 2,
        ride: 5,
        stops: 2,
        seats: 4,
        occupancy: 'seats',
        next: 2,
      },
      {
        id: 'brt102',
        line: 'BRT 102',
        color: '#B0002A',
        board: l('موقف الدوار السابع', '7th Circle Station'),
        walk: 5,
        ride: 13,
        stops: 6,
        seats: 6,
        occupancy: 'seats',
        next: 4,
      },
      {
        id: 'bus101',
        line: 'Amman Bus 101',
        color: '#B45309',
        board: l('مجمع صويلح', 'Sweileh Terminal'),
        walk: 8,
        ride: 19,
        stops: 9,
        seats: null,
        occupancy: 'standing',
        next: 8,
      },
    ],
  },
];

export function getTrips(destination: string, _lang: Lang): TripOption[] {
  const alight = destination.trim();
  const value = alight.toLowerCase();
  const seed =
    tripSeeds.find((item) => item.match.some((term) => value.includes(term.toLowerCase()))) ??
    tripSeeds[0];
  const now = Date.now();
  return seed.trips.map((trip) => ({
    ...trip,
    alight,
    arrivalAt: new Date(now + (trip.next + trip.ride) * 60_000).toISOString(),
  }));
}

export const quickMessages: Localized[] = [
  l('أحتاج إلى النزول في المحطة القادمة، يرجى التمهل.', 'I need to get off at the next station, please wait.'),
  l('أحتاج المساعدة في تحديد المقعد.', 'I need help finding a seat.'),
  l('يرجى الانتظار لحين صعودي بالكامل.', 'Please wait until I board fully.'),
  l('هل المحطة القادمة هي مجمع الشمال؟', 'Is the next station the North Complex?'),
];

export const modeIcons = {
  visual: Volume2,
  hearing: Vibrate,
};

export const valueIcons = [MapPin, Navigation, Hand];
export const seatAccessibleIcon = Accessibility;
export const speechIcon = Headphones;
