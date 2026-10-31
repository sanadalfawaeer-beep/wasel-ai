import { useEffect, useState, type FormEvent } from 'react';
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  Bus,
  Check,
  ChevronLeft,
  ChevronRight,
  Mic,
  Pause,
  Play,
  Send,
  Star,
  Vibrate,
  Volume2,
} from 'lucide-react';
import {
  features,
  getTrips,
  impactItems,
  journeySteps,
  L,
  modes,
  navItems,
  quickDestinations,
  quickMessages,
  seatSections,
  ui,
  type Lang,
  type Mode,
  type Seat,
  type TripOption,
} from './content';

type ChatMessage = {
  from: 'rider' | 'driver';
  text: string;
};

function SectionHead({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="section-head">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function BusArt() {
  return (
    <svg
      className="bus-art"
      viewBox="0 0 560 340"
      role="img"
      aria-label="Illustration of a red accessible BRT bus"
    >
      <path
        d="M18 296 C120 230 190 300 280 236 C374 170 420 120 542 74"
        fill="none"
        stroke="#7A4A54"
        strokeWidth="3"
        strokeDasharray="2 13"
        strokeLinecap="round"
      />
      <circle cx="18" cy="296" r="7" fill="#FF6B81" />
      <circle cx="280" cy="236" r="6" fill="#E9B4BF" />
      <circle cx="542" cy="74" r="8" fill="#FF6B81" />
      <rect x="63" y="96" width="434" height="172" rx="34" fill="#B0002A" />
      <rect x="86" y="72" width="388" height="166" rx="28" fill="#D2042D" />
      <rect x="108" y="94" width="88" height="56" rx="12" fill="#FFF3F4" />
      <rect x="208" y="94" width="88" height="56" rx="12" fill="#FFF3F4" />
      <rect x="308" y="94" width="88" height="56" rx="12" fill="#FFF3F4" />
      <rect x="408" y="94" width="46" height="56" rx="10" fill="#FFF3F4" />
      <rect x="108" y="164" width="288" height="46" rx="12" fill="#8E0022" />
      <rect x="408" y="164" width="46" height="76" rx="10" fill="#FFF3F4" />
      <text x="124" y="195" fill="#FFD9DF" fontSize="21" fontFamily="Space Grotesk, sans-serif" fontWeight="700">
        BRT 102
      </text>
      <circle cx="146" cy="276" r="25" fill="#1B1013" />
      <circle cx="146" cy="276" r="11" fill="#5A3A42" />
      <circle cx="428" cy="276" r="25" fill="#1B1013" />
      <circle cx="428" cy="276" r="11" fill="#5A3A42" />
      <rect x="310" y="230" width="168" height="38" rx="19" fill="#1B1013" opacity="0.92" />
      <text x="330" y="255" fill="#FFF3F4" fontSize="14" fontFamily="IBM Plex Sans Arabic, sans-serif">
        accessible • BRT
      </text>
    </svg>
  );
}

function TripCard({ trip, lang }: { trip: TripOption; lang: Lang }) {
  const arrival = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-JO' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(trip.arrivalAt));

  return (
    <article className="trip-card">
      <div className="trip-top">
        <span
          className="line-badge"
          style={{ borderColor: trip.color, color: trip.color }}
        >
          <Bus size={14} aria-hidden="true" />
          {trip.line}
        </span>
        <span className="micro-badge">{L(ui.planPrototype, lang)}</span>
      </div>
      <p className="trip-route">
        {L(trip.board, lang)}
        {lang === 'ar' ? <ArrowLeft size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}
        {trip.alight}
      </p>
      <div className="trip-meta">
        <span>{L(ui.planWalk, lang)} {trip.walk} {L(ui.minutesShort, lang)}</span>
        <span>{L(ui.planRide, lang)} {trip.ride} {L(ui.minutesShort, lang)}</span>
        <span>{trip.stops} {L(ui.planStops, lang)}</span>
        <span>{L(ui.planArrive, lang)}: {arrival}</span>
      </div>
      <div className="trip-bottom">
        <strong>
          {trip.seats != null
            ? `${trip.seats} ${L(ui.planSeats, lang)}`
            : L(ui.planStanding, lang)}
        </strong>
        <span>
          {L(ui.planNext, lang)}: {trip.next} {L(ui.minutesShort, lang)}
        </span>
      </div>
    </article>
  );
}

function SeatMap({
  lang,
  mode,
  onSelect,
}: {
  lang: Lang;
  mode: Mode;
  onSelect: (seat: Seat) => void;
}) {
  const statusLabel = (seat: Seat) =>
    seat.status === 'available'
      ? L(ui.seatsAvailable, lang)
      : seat.status === 'accessible'
        ? L(ui.seatsAccessible, lang)
        : L(ui.seatsOccupied, lang);

  return (
    <div className={`bus-shell mode-${mode}`} dir="ltr">
      <div className="bus-front">
        <span>{L(ui.seatsDriver, lang)}</span>
        <span className="steering-wheel" aria-hidden="true" />
      </div>
      <p className="door-label">{L(ui.seatsDoor, lang)}</p>
      {seatSections.map((section) => {
        const sectionAvailable = section.seats.filter(
          (seat) => seat.status === 'available',
        ).length;
        return (
          <div className="seat-section" key={section.id}>
            <h4>
              <span>{L(section.title, lang)}</span>
              <span className="section-count">
                {sectionAvailable} {L(ui.seatsAvailable, lang)}
              </span>
            </h4>
            <div className="seat-grid">
              {section.seats.map((seat) => (
                <button
                  key={seat.id}
                  type="button"
                  className={`seat seat-${seat.status}`}
                  onClick={() => onSelect(seat)}
                  aria-label={`${seat.id} — ${statusLabel(seat)}`}
                >
                  {seat.status === 'accessible' ? (
                    <Accessibility size={15} aria-hidden="true" />
                  ) : null}
                  <span>{seat.id}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const [lang, setLang] = useState<Lang>('ar');
  const [mode, setMode] = useState<Mode>('visual');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [flash, setFlash] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [destination, setDestination] = useState('');
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [planning, setPlanning] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [seatReadout, setSeatReadout] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState('');
  const [surveyName, setSurveyName] = useState('');
  const [surveyCategory, setSurveyCategory] = useState('');
  const [surveyRating, setSurveyRating] = useState(0);
  const [surveyNotes, setSurveyNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const tr = (value: { ar: string; en: string }) => L(value, lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title =
      lang === 'ar'
        ? 'ACCESSIBLE BRT — النقل الذكي والمتاح للجميع'
        : 'ACCESSIBLE BRT — Smart, accessible transport';
  }, [lang]);

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduceMotion);
  }, [reduceMotion]);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ar' ? 'ar-JO' : 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const flashScreen = () => {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 900);
    const nav = navigator as Navigator & { vibrate?: (pattern: number[]) => boolean };
    nav.vibrate?.([80, 50, 80]);
  };

  const tryMode = (next: Mode) => {
    setMode(next);
    if (next === 'visual') speak(tr(ui.modeSample));
    else flashScreen();
  };

  const planTrip = (value?: string) => {
    const dest = (value ?? destination).trim() || tr(ui.planDefault);
    setDestination(dest);
    setPlanning(true);
    setTrips([]);
    window.setTimeout(() => {
      setTrips(getTrips(dest, lang));
      setPlanning(false);
    }, 450);
  };

  const onPlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    planTrip();
  };

  const onSeat = (seat: Seat) => {
    const status =
      seat.status === 'available'
        ? tr(ui.seatsAvailable)
        : seat.status === 'accessible'
          ? tr(ui.seatsAccessible)
          : tr(ui.seatsOccupied);
    const text = `${seat.id} — ${status}`;
    setSelectedSeat(text);
    setSeatReadout('');
    if (mode === 'visual') speak(text);
    else flashScreen();
  };

  const readSeats = () => {
    const ids = seatSections
      .flatMap((section) => section.seats)
      .filter((seat) => seat.status === 'available')
      .map((seat) => seat.id);
    const text = ids.length
      ? lang === 'ar'
        ? `المقاعد المتاحة: ${ids.join('، ')}`
        : `Available seats: ${ids.join(', ')}`
      : tr(ui.seatsNone);
    setSelectedSeat(null);
    setSeatReadout(text);
    if (mode === 'visual') speak(text);
    else flashScreen();
  };

  const speakFeature = (title: string, body: string) => {
    const text = `${title}. ${body}`;
    if (mode === 'visual') speak(text);
    else flashScreen();
  };

  const driverReply = (text: string) => {
    const value = text.toLowerCase();
    if (value.includes('مقعد') || value.includes('seat')) return tr(ui.commReplySeat);
    if (value.includes('محطة') || value.includes('station') || value.includes('next')) {
      return tr(ui.commReplyStation);
    }
    return tr(ui.commReplyDefault);
  };

  const sendMessage = (text: string) => {
    const value = text.trim();
    if (!value || thinking) return;
    setMessages((current) => [...current, { from: 'rider', text: value }]);
    setChatInput('');
    setThinking(true);
    window.setTimeout(() => {
      const reply = driverReply(value);
      setMessages((current) => [...current, { from: 'driver', text: reply }]);
      setThinking(false);
      if (mode === 'visual') speak(reply);
      else flashScreen();
    }, 900);
  };

  const onChatSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(chatInput);
  };

  const startListening = () => {
    const speechWindow = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: ((event: { results?: Array<Array<{ transcript?: string }>> }) => void) | null;
        onend: (() => void) | null;
        onerror: (() => void) | null;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: ((event: { results?: Array<Array<{ transcript?: string }>> }) => void) | null;
        onend: (() => void) | null;
        onerror: (() => void) | null;
        start: () => void;
      };
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setNotice(tr(ui.commMicUnsupported));
      return;
    }
    try {
      const recognition = new Recognition();
      recognition.lang = lang === 'ar' ? 'ar-JO' : 'en-US';
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) setChatInput(transcript);
      };
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
      recognition.start();
      setListening(true);
      setNotice('');
    } catch {
      setNotice(tr(ui.commMicUnsupported));
    }
  };

  const onSurvey = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    try {
      localStorage.setItem(
        'accessible-brt-survey',
        JSON.stringify({
          name: surveyName,
          category: surveyCategory,
          rating: surveyRating,
          notes: surveyNotes,
          at: new Date().toISOString(),
        }),
      );
    } catch {
      // Local storage is optional for this prototype.
    }
  };

  const allSeats = seatSections.flatMap((section) => section.seats);
  const availableCount = allSeats.filter((seat) => seat.status === 'available').length;
  const accessibleCount = allSeats.filter((seat) => seat.status === 'accessible').length;
  const selectedStep = journeySteps[activeStep];
  const StepIcon = selectedStep.icon;

  return (
    <>
      <a className="skip-link" href="#main">
        {tr(ui.skip)}
      </a>
      <div className={`flash-overlay ${flash ? 'is-flashing' : ''}`} aria-hidden="true" />

      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#home" aria-label="ACCESSIBLE BRT">
            <span className="brand-mark">
              <Bus size={21} aria-hidden="true" />
            </span>
            <span className="brand-copy">
              <strong>ACCESSIBLE BRT</strong>
              <small>{tr(ui.brandTag)}</small>
            </span>
          </a>
          <nav className="nav" aria-label={lang === 'ar' ? 'التنقل' : 'Navigation'}>
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`}>
                {L(item.label, lang)}
              </a>
            ))}
          </nav>
          <div className="header-controls">
            <div className="lang-switch" role="group" aria-label={tr(ui.language)}>
              <button
                type="button"
                className={lang === 'ar' ? 'is-active' : ''}
                aria-pressed={lang === 'ar'}
                onClick={() => setLang('ar')}
              >
                {tr(ui.arabic)}
              </button>
              <button
                type="button"
                className={lang === 'en' ? 'is-active' : ''}
                aria-pressed={lang === 'en'}
                onClick={() => setLang('en')}
              >
                EN
              </button>
            </div>
            <button
              type="button"
              className="motion-toggle"
              aria-pressed={reduceMotion}
              onClick={() => setReduceMotion((current) => !current)}
            >
              {reduceMotion ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
              {reduceMotion ? tr(ui.motionOn) : tr(ui.motionOff)}
            </button>
          </div>
        </div>
      </header>

      <main id="main">
        <section id="home" className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow on-dark">{tr(ui.heroEyebrow)}</span>
              <h1>{tr(ui.heroTitle)}</h1>
              <p className="hero-subtitle">{tr(ui.heroSubtitle)}</p>
              <p className="hero-quote">{tr(ui.heroQuote)}</p>
              <div className="hero-actions">
                <a className="btn primary" href="#planner">
                  {tr(ui.ctaTry)}
                  {lang === 'ar' ? <ArrowLeft size={18} aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
                </a>
                <a className="btn ghost" href="#about">
                  {tr(ui.ctaExplore)}
                </a>
                <button
                  type="button"
                  className="hero-listen"
                  onClick={() => speak(`${tr(ui.heroSubtitle)}. ${tr(ui.heroQuote)}`)}
                >
                  <Volume2 size={17} aria-hidden="true" />
                  {tr(ui.ctaListen)}
                </button>
              </div>
              <div className="stat-row">
                {[
                  { value: '100%', label: ui.statIndependence },
                  { value: 'AI', label: ui.statAi },
                  { value: 'IoT', label: ui.statIot },
                  { value: '2', label: ui.statModes },
                ].map((stat) => (
                  <div className="stat" key={stat.value}>
                    <strong>{stat.value}</strong>
                    <span>{L(stat.label, lang)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-visual">
              <p className="hero-caption">
                <strong>{tr(ui.heroVisualCaption)}</strong>
                <span>{tr(ui.heroVisualSub)}</span>
              </p>
              <div className="bus-stage">
                <BusArt />
              </div>
              <div className="floating-card">
                <span className="live-dot" />
                <div>
                  <strong>{tr(ui.heroCardTitle)}</strong>
                  <small>{tr(ui.heroCardMeta)}</small>
                </div>
                <span className="micro-badge">{tr(ui.heroCardDemo)}</span>
              </div>
            </div>
          </div>
        </section>

        <section id="planner" className="section">
          <div className="container">
            <SectionHead
              eyebrow={tr(ui.planEyebrow)}
              title={tr(ui.planTitle)}
              description={tr(ui.planDesc)}
            />
            <form className="planner-card" onSubmit={onPlan}>
              <label htmlFor="destination">{tr(ui.planLabel)}</label>
              <div className="planner-row">
                <input
                  id="destination"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder={tr(ui.planPlaceholder)}
                  autoComplete="off"
                />
                <button className="btn primary" type="submit">
                  <Bus size={18} aria-hidden="true" />
                  {tr(ui.planButton)}
                </button>
              </div>
              <div className="quick-row">
                <span>{tr(ui.planQuick)}</span>
                {quickDestinations.map((place) => (
                  <button
                    type="button"
                    className="chip"
                    key={place.en}
                    onClick={() => planTrip(L(place, lang))}
                  >
                    {L(place, lang)}
                  </button>
                ))}
              </div>
            </form>
            <div className="planner-output" aria-live="polite">
              {planning ? (
                <p className="status-line">
                  <span className="spinner" aria-hidden="true" />
                  {tr(ui.planPlanning)}
                </p>
              ) : null}
              {trips.length > 0 ? (
                <>
                  <h3 className="output-title">{tr(ui.planResults)}</h3>
                  <div className="trip-grid" aria-label={tr(ui.planAria)}>
                    {trips.map((trip) => (
                      <TripCard key={trip.id} trip={trip} lang={lang} />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </section>

        <section id="about" className="section section-tint">
          <div className="container">
            <SectionHead
              eyebrow={tr(ui.aboutEyebrow)}
              title={tr(ui.aboutTitle)}
              description={tr(ui.aboutBody)}
            />
            <div className="value-grid">
              {ui.values.map((value) => {
                const Icon = value.icon;
                return (
                  <article className="value-card" key={value.title.en}>
                    <span className="icon-tile">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <h3>{L(value.title, lang)}</h3>
                    <p>{L(value.body, lang)}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="features" className="section">
          <div className="container">
            <SectionHead
              eyebrow={tr(ui.featuresEyebrow)}
              title={tr(ui.featuresTitle)}
              description={tr(ui.featuresDesc)}
            />
            <p className="feature-legend">{tr(ui.featuresLegend)}</p>
            <div className="feature-grid">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article className="feature-card" key={feature.id}>
                    <div className="feature-top">
                      <span className="icon-tile">
                        <Icon size={22} aria-hidden="true" />
                      </span>
                      <span className={`micro-badge ${feature.badge === 'future' ? 'future' : ''}`}>
                        {feature.badge === 'future' ? tr(ui.future) : tr(ui.prototype)}
                      </span>
                    </div>
                    <h3>{L(feature.title, lang)}</h3>
                    <p>{L(feature.body, lang)}</p>
                    <button
                      type="button"
                      className="listen-link"
                      onClick={() => speakFeature(L(feature.title, lang), L(feature.body, lang))}
                    >
                      <Volume2 size={14} aria-hidden="true" />
                      {tr(ui.featureListen)}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="journey" className="section section-dark">
          <div className="container">
            <SectionHead
              eyebrow={tr(ui.journeyEyebrow)}
              title={tr(ui.journeyTitle)}
              description={tr(ui.journeyDesc)}
            />
            <div className="journey-grid">
              <div className="step-list" role="tablist" aria-label={tr(ui.journeyTitle)}>
                {journeySteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <button
                      type="button"
                      key={step.id}
                      role="tab"
                      aria-selected={index === activeStep}
                      className={`step-button ${index === activeStep ? 'is-active' : ''}`}
                      onClick={() => setActiveStep(index)}
                    >
                      <span className="step-number">{index + 1}</span>
                      <Icon size={18} aria-hidden="true" />
                      <span>{L(step.title, lang)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="phone" role="tabpanel" aria-live="polite">
                <div className="phone-top">
                  <span className="phone-brand">
                    <Bus size={15} aria-hidden="true" />
                    {tr(ui.journeyPhoneTitle)}
                  </span>
                  <span className="live-pill">
                    <span className="live-dot" />
                    {tr(ui.heroCardDemo)}
                  </span>
                </div>
                <div className="phone-body">
                  <span className="phone-icon">
                    <StepIcon size={28} aria-hidden="true" />
                  </span>
                  <span className="phone-kicker">
                    {tr(ui.journeyStep)} {activeStep + 1}
                  </span>
                  <h3>{L(selectedStep.title, lang)}</h3>
                  <p>{L(selectedStep.body, lang)}</p>
                  <span className={`mode-pill ${mode === 'hearing' ? 'hearing' : ''}`}>
                    {mode === 'visual' ? <Volume2 size={14} aria-hidden="true" /> : <Vibrate size={14} aria-hidden="true" />}
                    {mode === 'visual' ? tr(ui.journeyAudio) : tr(ui.journeyCaptions)}
                  </span>
                  <blockquote>{L(selectedStep.sample, lang)}</blockquote>
                  <div className="phone-actions">
                    <button
                      type="button"
                      className="btn small light"
                      onClick={() =>
                        mode === 'visual'
                          ? speak(L(selectedStep.sample, lang))
                          : flashScreen()
                      }
                    >
                      {mode === 'visual' ? <Volume2 size={16} /> : <Vibrate size={16} />}
                      {mode === 'visual' ? tr(ui.journeyListen) : tr(ui.journeyVibrate)}
                    </button>
                  </div>
                </div>
                <div className="phone-nav">
                  <button
                    type="button"
                    className="phone-nav-button"
                    onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
                    disabled={activeStep === 0}
                  >
                    {lang === 'ar' ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
                    {tr(ui.journeyPrev)}
                  </button>
                  <span>{activeStep + 1} / {journeySteps.length}</span>
                  <button
                    type="button"
                    className="phone-nav-button"
                    onClick={() =>
                      setActiveStep((current) => Math.min(journeySteps.length - 1, current + 1))
                    }
                    disabled={activeStep === journeySteps.length - 1}
                  >
                    {tr(ui.journeyNext)}
                    {lang === 'ar' ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="modes" className="section">
          <div className="container">
            <SectionHead
              eyebrow={tr(ui.modesEyebrow)}
              title={tr(ui.modesTitle)}
              description={tr(ui.modesDesc)}
            />
            <div className="mode-grid">
              {modes.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    className={`mode-card ${mode === item.id ? 'is-active' : ''}`}
                    key={item.id}
                  >
                    <div className="mode-top">
                      <span className="icon-tile large">
                        <Icon size={26} aria-hidden="true" />
                      </span>
                      <div>
                        <h3>{L(item.title, lang)}</h3>
                        <p>{L(item.forWhom, lang)}</p>
                      </div>
                    </div>
                    <ul>
                      {item.features.map((feature) => (
                        <li key={feature.en}>
                          <Check size={16} aria-hidden="true" />
                          <span>{L(feature, lang)}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className={`btn ${mode === item.id ? 'primary' : 'secondary'}`}
                      onClick={() => tryMode(item.id)}
                    >
                      {L(item.button, lang)}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="seats" className="section section-tint">
          <div className="container">
            <SectionHead
              eyebrow={tr(ui.seatsEyebrow)}
              title={tr(ui.seatsTitle)}
              description={tr(ui.seatsDesc)}
            />
            <div className="seat-layout">
              <SeatMap lang={lang} mode={mode} onSelect={onSeat} />
              <aside className="seat-info">
                <div className="seat-count">
                  <strong>{availableCount}</strong>
                  <span>{tr(ui.seatsAvailableCount)}</span>
                </div>
                <div className="seat-count">
                  <strong>{accessibleCount}</strong>
                  <span>{tr(ui.seatsAccessibleCount)}</span>
                </div>
                <div className="legend">
                  <span><i className="dot available" />{tr(ui.seatsAvailable)}</span>
                  <span><i className="dot occupied" />{tr(ui.seatsOccupied)}</span>
                  <span><i className="dot accessible" />{tr(ui.seatsAccessible)}</span>
                </div>
                <button type="button" className="btn secondary small" onClick={readSeats}>
                  <Volume2 size={15} aria-hidden="true" />
                  {tr(ui.seatsReadAll)}
                </button>
                {selectedSeat ? (
                  <p className="seat-selected" role="status">
                    {tr(ui.seatsSelected)}: <strong>{selectedSeat}</strong>
                  </p>
                ) : null}
                {seatReadout ? (
                  <p className="seat-selected" role="status">
                    {seatReadout}
                  </p>
                ) : null}
                <div className="pipeline">
                  <span className="pipeline-title">{tr(ui.seatsPipelineTitle)}</span>
                  <ol>
                    {ui.seatsPipeline.map((step, index) => (
                      <li key={step.en}>
                        <span>{index + 1}</span>
                        {L(step, lang)}
                      </li>
                    ))}
                  </ol>
                </div>
                <p className="note">{tr(ui.seatsNote)}</p>
              </aside>
            </div>
          </div>
        </section>

        <section id="communication" className="section">
          <div className="container">
            <SectionHead
              eyebrow={tr(ui.commEyebrow)}
              title={tr(ui.commTitle)}
              description={tr(ui.commDesc)}
            />
            <div className="comm-grid">
              <div className="chat-card">
                <div className="chat-head">
                  <span className="line-badge">BRT 102</span>
                  <span className="micro-badge">{tr(ui.commPrototype)}</span>
                </div>
                <div className="chat-log" aria-live="polite">
                  {messages.length === 0 ? (
                    <div className="bubble driver">
                      <span>{tr(ui.commDriver)}</span>
                      <p>{tr(ui.commWelcome)}</p>
                    </div>
                  ) : null}
                  {messages.map((message, index) => (
                    <div className={`bubble ${message.from}`} key={`${message.from}-${index}`}>
                      <span>{message.from === 'rider' ? tr(ui.commRider) : tr(ui.commDriver)}</span>
                      <p>{message.text}</p>
                    </div>
                  ))}
                  {thinking ? <p className="thinking">{tr(ui.commThinking)}</p> : null}
                </div>
                <div className="quick-messages">
                  <span>{tr(ui.commQuick)}</span>
                  <div>
                    {quickMessages.map((message) => (
                      <button
                        type="button"
                        className="chip small"
                        key={message.en}
                        onClick={() => sendMessage(L(message, lang))}
                      >
                        {L(message, lang)}
                      </button>
                    ))}
                  </div>
                </div>
                <form className="chat-form" onSubmit={onChatSubmit}>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={tr(ui.commMic)}
                    onClick={startListening}
                  >
                    {listening ? <span className="pulse-dot" /> : <Mic size={18} />}
                  </button>
                  <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder={tr(ui.commPlaceholder)}
                    aria-label={tr(ui.commPlaceholder)}
                  />
                  <button className="icon-button accent" type="submit" aria-label={tr(ui.commSend)}>
                    <Send size={18} />
                  </button>
                </form>
                {notice ? <p className="form-note">{notice}</p> : null}
              </div>
              <aside className="driver-card">
                <span className="icon-tile">
                  <Bus size={22} aria-hidden="true" />
                </span>
                <h3>{tr(ui.commActive)}</h3>
                <p className="driver-status"><span className="live-dot" />{tr(ui.commAi)}</p>
                <p>{tr(ui.commConnected)}</p>
                <div className="driver-screen">
                  <span>BRT 102</span>
                  <strong>{tr(ui.commDriver)}</strong>
                  <p>{messages.filter((message) => message.from === 'rider').slice(-1)[0]?.text ?? tr(ui.commWelcome)}</p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section id="impact" className="section section-tint">
          <div className="container">
            <SectionHead
              eyebrow={tr(ui.impactEyebrow)}
              title={tr(ui.impactTitle)}
              description={tr(ui.impactDesc)}
            />
            <div className="impact-grid">
              {impactItems.map((item) => {
                const Icon = item.icon;
                return (
                  <article className="impact-card" key={item.title.en}>
                    <span className="icon-tile">
                      <Icon size={21} aria-hidden="true" />
                    </span>
                    <h3>{L(item.title, lang)}</h3>
                    <p>{L(item.body, lang)}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="survey" className="section">
          <div className="container survey-wrap">
            <div>
              <SectionHead
                eyebrow={tr(ui.surveyEyebrow)}
                title={tr(ui.surveyTitle)}
                description={tr(ui.surveyDesc)}
              />
              <p className="note">{tr(ui.surveyLocal)}</p>
            </div>
            {submitted ? (
              <div className="survey-success" role="status">
                <span className="icon-tile">
                  <Check size={24} aria-hidden="true" />
                </span>
                <p>{tr(ui.surveySuccess)}</p>
              </div>
            ) : (
              <form className="survey-card" onSubmit={onSurvey}>
                <label>
                  {tr(ui.surveyName)}
                  <input
                    value={surveyName}
                    onChange={(event) => setSurveyName(event.target.value)}
                    autoComplete="name"
                  />
                </label>
                <label>
                  {tr(ui.surveyCategory)}
                  <select
                    value={surveyCategory}
                    onChange={(event) => setSurveyCategory(event.target.value)}
                    required
                  >
                    <option value="" disabled>
                      {lang === 'ar' ? 'اختر الفئة' : 'Choose a category'}
                    </option>
                    {ui.surveyCategoryOptions.map((category) => (
                      <option key={category.en} value={L(category, lang)}>
                        {L(category, lang)}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset>
                  <legend>{tr(ui.surveyRating)}</legend>
                  <div className="rating-row">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        type="button"
                        key={value}
                        className={`star-button ${value <= surveyRating ? 'is-filled' : ''}`}
                        aria-label={`${value} / 5`}
                        aria-pressed={value <= surveyRating}
                        onClick={() => setSurveyRating(value)}
                      >
                        <Star size={22} fill={value <= surveyRating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label>
                  {tr(ui.surveyNotes)}
                  <textarea
                    value={surveyNotes}
                    onChange={(event) => setSurveyNotes(event.target.value)}
                    rows={4}
                  />
                </label>
                <button className="btn primary" type="submit" disabled={!surveyRating || !surveyCategory}>
                  {tr(ui.surveySubmit)}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <a className="brand footer-brand" href="#home">
              <span className="brand-mark"><Bus size={20} aria-hidden="true" /></span>
              <span className="brand-copy"><strong>ACCESSIBLE BRT</strong><small>{tr(ui.brandTag)}</small></span>
            </a>
            <p>{tr(ui.footerDisclaimer)}</p>
          </div>
          <nav className="footer-links" aria-label={tr(ui.footerLinks)}>
            <strong className="footer-heading">{tr(ui.footerLinks)}</strong>
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`}>
                {L(item.label, lang)}
              </a>
            ))}
          </nav>
          <div className="footer-meta">
            <strong className="footer-heading">{tr(ui.footerTeam)}</strong>
            <p>{tr(ui.footerTeamBody)}</p>
            <p>{tr(ui.footerProject)}</p>
            <p>{tr(ui.footerCollege)} · {tr(ui.footerMajor)}</p>
            <p>{tr(ui.footerRights)}</p>
            <p>{tr(ui.footerMade)}</p>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
