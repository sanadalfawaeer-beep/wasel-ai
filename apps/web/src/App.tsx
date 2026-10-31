import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  Accessibility,
  Armchair,
  ArrowLeft,
  ArrowRight,
  Bus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Mic,
  Pause,
  Play,
  Send,
  Vibrate,
  Volume2,
} from 'lucide-react';
import {
  getTrips,
  journeySteps,
  L,
  navItems,
  quickDestinations,
  quickMessages,
  seatSections,
  ui,
  type Lang,
  type Localized,
  type Mode,
  type Seat,
  type SeatSection,
  type TripOption,
} from './content';
import {
  geocodeDestination,
  localPlace,
  osmEmbedUrl,
  type OsmPlace,
} from './osm';

type ChatMessage = {
  from: 'rider' | 'driver';
  text: string;
};

type PreferredLine = 'none' | 'BRT 102' | 'Amman Bus 101' | 'BRT 103';

type SettingsState = {
  lang: Lang;
  mode: Mode;
  reduceMotion: boolean;
  voiceEnabled: boolean;
  hapticsEnabled: boolean;
  speechRate: number;
  preferredLine: PreferredLine;
  autoReadPlan: boolean;
};

const SETTINGS_KEY = 'accessible-brt-settings';

const DEFAULT_SETTINGS: SettingsState = {
  lang: 'ar',
  mode: 'visual',
  reduceMotion: false,
  voiceEnabled: true,
  hapticsEnabled: true,
  speechRate: 0.95,
  preferredLine: 'none',
  autoReadPlan: false,
};

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    const preferredLines: PreferredLine[] = ['none', 'BRT 102', 'Amman Bus 101', 'BRT 103'];
    return {
      lang: parsed.lang === 'en' ? 'en' : 'ar',
      mode: parsed.mode === 'hearing' ? 'hearing' : 'visual',
      reduceMotion: Boolean(parsed.reduceMotion),
      voiceEnabled: parsed.voiceEnabled !== false,
      hapticsEnabled: parsed.hapticsEnabled !== false,
      speechRate:
        typeof parsed.speechRate === 'number' ? parsed.speechRate : DEFAULT_SETTINGS.speechRate,
      preferredLine:
        parsed.preferredLine && preferredLines.includes(parsed.preferredLine)
          ? parsed.preferredLine
          : 'none',
      autoReadPlan: Boolean(parsed.autoReadPlan),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const pageTitles: Record<string, Localized> = {
  '/': ui.planTitle,
  '/trip': ui.journeyTitle,
  '/seats': ui.seatsTitle,
  '/chat': ui.commTitle,
  '/settings': ui.settingsTitle,
};

function RouteEffects({ lang }: { lang: Lang }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const title = pageTitles[location.pathname] ?? pageTitles['/'];
    document.title = `${L(title, lang)} — Wasel A.I.`;
  }, [location.pathname, lang]);

  return null;
}

function PageHead({ title }: { title: string }) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
    </div>
  );
}

type SpeechResultEvent = {
  results?: Array<Array<{ transcript?: string }>>;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const speechWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function WelcomePage({
  lang,
  setLang,
  onChoose,
}: {
  lang: Lang;
  setLang: (value: Lang) => void;
  onChoose: (mode: Mode) => void;
}) {
  const tr = (value: Localized) => L(value, lang);
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const [seconds, setSeconds] = useState(5);
  const chooseRef = useRef(onChoose);

  useEffect(() => {
    chooseRef.current = onChoose;
  }, [onChoose]);

  useEffect(() => {
    if (seconds <= 0) {
      chooseRef.current('visual');
      return;
    }
    const timer = window.setTimeout(() => setSeconds((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  return (
    <div className="welcome-page">
      <div className="container welcome-top">
        <span className="welcome-brand">
          <span className="brand-mark">
            <Bus size={21} aria-hidden="true" />
          </span>
          <strong dir="ltr">WASEL A.I.</strong>
        </span>
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
      </div>

      <main className="container welcome-main">
        <h1>{tr(ui.welcomeTitle)}</h1>
        <p>{tr(ui.welcomeSubtitle)}</p>
        <div className="welcome-options">
          <button type="button" className="welcome-option visual" onClick={() => onChoose('visual')}>
            <span className="welcome-option-icon">
              <Volume2 size={28} aria-hidden="true" />
            </span>
            <span className="welcome-option-copy">
              <strong>{tr(ui.modeVisualTitle)}</strong>
              <small>{tr(ui.welcomeVisualDesc)}</small>
            </span>
            <Arrow size={20} aria-hidden="true" />
          </button>
          <button type="button" className="welcome-option hearing" onClick={() => onChoose('hearing')}>
            <span className="welcome-option-icon">
              <Vibrate size={28} aria-hidden="true" />
            </span>
            <span className="welcome-option-copy">
              <strong>{tr(ui.modeHearingTitle)}</strong>
              <small>{tr(ui.welcomeHearingDesc)}</small>
            </span>
            <Arrow size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="welcome-auto" role="status">{tr(ui.welcomeAutoHint)}</p>
        <div className="welcome-timer" aria-hidden="true">
          <span style={{ width: `${(seconds / 5) * 100}%` }} />
        </div>
      </main>
    </div>
  );
}

function TripCard({
  trip,
  lang,
  selected,
  onSelect,
}: {
  trip: TripOption;
  lang: Lang;
  selected: boolean;
  onSelect: (trip: TripOption) => void;
}) {
  const arrival = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-JO' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(trip.arrivalAt));

  return (
    <button
      type="button"
      className={`trip-card ${selected ? 'is-selected' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(trip)}
    >
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
          <Armchair size={14} aria-hidden="true" />
          {trip.seats != null
            ? `${trip.seats} ${L(ui.planSeats, lang)}`
            : L(ui.planStanding, lang)}
        </strong>
        <span>
          {L(ui.planNext, lang)}: {trip.next} {L(ui.minutesShort, lang)}
        </span>
      </div>
      <span className="trip-seat-cta">
        {selected ? L(ui.planSelected, lang) : L(ui.planViewSeats, lang)}
      </span>
    </button>
  );
}

function SeatMap({
  lang,
  mode,
  onSelect,
  sections = seatSections,
}: {
  lang: Lang;
  mode: Mode;
  onSelect: (seat: Seat) => void;
  sections?: SeatSection[];
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
      {sections.map((section) => {
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

function seatsForTrip(trip: TripOption): SeatSection[] {
  let remaining = trip.seats ?? 0;
  return seatSections.map((section) => ({
    ...section,
    seats: section.seats.map((seat) => {
      if (seat.status === 'accessible') return seat;
      if (remaining > 0) {
        remaining -= 1;
        return { ...seat, status: 'available' as const };
      }
      return { ...seat, status: 'occupied' as const };
    }),
  }));
}

function PlanPage({
  lang,
  mode,
  destination,
  setDestination,
  onPlan,
  planning,
  trips,
  planTrip,
  selectedTrip,
  selectedTripSeats,
  onSelectTrip,
  onSeat,
  destinationPoint,
  voiceListening,
  voiceNotice,
  onVoice,
}: {
  lang: Lang;
  mode: Mode;
  destination: string;
  setDestination: (value: string) => void;
  onPlan: (event: FormEvent<HTMLFormElement>) => void;
  planning: boolean;
  trips: TripOption[];
  planTrip: (value?: string) => void;
  selectedTrip: TripOption | null;
  selectedTripSeats: SeatSection[];
  onSelectTrip: (trip: TripOption) => void;
  onSeat: (seat: Seat) => void;
  destinationPoint: OsmPlace | null;
  voiceListening: boolean;
  voiceNotice: string;
  onVoice: () => void;
}) {
  const tr = (value: Localized) => L(value, lang);

  return (
    <section id="planner" className="section section-first">
      <div className="container">
        <div className="app-head">
          <div className="app-head-copy">
            <h1>{tr(ui.planTitle)}</h1>
          </div>
          <div className="live-status">
            <span className="live-dot" />
            <div>
              <strong>{tr(ui.heroCardTitle)}</strong>
              <small>{tr(ui.heroCardMeta)}</small>
            </div>
            <span className="micro-badge">{tr(ui.heroCardDemo)}</span>
          </div>
        </div>

        {mode === 'visual' ? (
          <div className="voice-planner-wrap">
            <button
              type="button"
              className={`voice-planner ${voiceListening ? 'is-listening' : ''}`}
              onClick={onVoice}
              disabled={voiceListening}
              aria-label={
                voiceListening
                  ? trips.length > 0
                    ? tr(ui.voiceListeningChoice)
                    : tr(ui.voiceListening)
                  : trips.length > 0
                    ? tr(ui.voiceChooseBus)
                    : tr(ui.voiceTapDestination)
              }
            >
              <span className="voice-orb">
                {voiceListening ? <span className="voice-wave" aria-hidden="true" /> : <Mic size={26} aria-hidden="true" />}
              </span>
              <span className="voice-copy">
                <strong>
                  {voiceListening
                    ? trips.length > 0
                      ? tr(ui.voiceListeningChoice)
                      : tr(ui.voiceListening)
                    : trips.length > 0
                      ? tr(ui.voiceChooseBus)
                      : tr(ui.voiceTapDestination)}
                </strong>
                <small>
                  {trips.length > 0 ? tr(ui.voiceChooseHint) : tr(ui.voiceDestinationHint)}
                </small>
              </span>
            </button>
            {voiceNotice ? (
              <p className="note voice-notice" role="status">{voiceNotice}</p>
            ) : null}
          </div>
        ) : null}

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
              <h2 className="output-title">{tr(ui.planResults)}</h2>
              <div className="trip-grid" aria-label={tr(ui.planAria)}>
                {trips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    lang={lang}
                    selected={selectedTrip?.id === trip.id}
                    onSelect={onSelectTrip}
                  />
                ))}
              </div>
            </>
          ) : null}

          {selectedTrip ? (
            <div id="trip-detail" className="trip-detail">
              <div className="trip-detail-head">
                <div>
                  <span
                    className="line-badge"
                    style={{ borderColor: selectedTrip.color, color: selectedTrip.color }}
                  >
                    <Bus size={14} aria-hidden="true" />
                    {selectedTrip.line}
                  </span>
                  <h2>{tr(ui.planSeatsTitle)}</h2>
                  <p className="trip-detail-route">
                    {L(selectedTrip.board, lang)}
                    {lang === 'ar' ? <ArrowLeft size={15} aria-hidden="true" /> : <ArrowRight size={15} aria-hidden="true" />}
                    {selectedTrip.alight}
                  </p>
                </div>
                <div className="seat-count">
                  <strong>{selectedTrip.seats ?? '—'}</strong>
                  <span>
                    {selectedTrip.seats != null
                      ? tr(ui.planSeats)
                      : tr(ui.planStanding)}
                  </span>
                </div>
              </div>
              {selectedTrip.seats != null ? (
                <div className="trip-detail-grid">
                  <SeatMap
                    lang={lang}
                    mode={mode}
                    onSelect={onSeat}
                    sections={selectedTripSeats}
                  />
                  <aside className="trip-detail-side">
                    <h3>{tr(ui.seatsLegendTitle)}</h3>
                    <div className="legend">
                      <span><i className="dot available" />{tr(ui.seatsAvailable)}</span>
                      <span><i className="dot occupied" />{tr(ui.seatsOccupied)}</span>
                      <span><i className="dot accessible" />{tr(ui.seatsAccessible)}</span>
                    </div>
                    <p className="note">{tr(ui.seatsNote)}</p>
                  </aside>
                </div>
              ) : (
                <p className="note">{tr(ui.seatsUnavailable)}</p>
              )}
            </div>
          ) : null}

          {destinationPoint && trips.length > 0 ? (
            <div className="osm-card">
              <div className="osm-head">
                <span className="osm-title">
                  <MapPin size={16} aria-hidden="true" />
                  {destination || tr(ui.planLabel)}
                </span>
                <span className="micro-badge">OpenStreetMap</span>
              </div>
              <iframe
                className="osm-map"
                title={`OpenStreetMap — ${destination || tr(ui.planLabel)}`}
                src={osmEmbedUrl(destinationPoint)}
                loading="lazy"
              />
              <a
                className="osm-credit"
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
              >
                © OpenStreetMap contributors
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function TripPage({
  lang,
  mode,
  activeStep,
  setActiveStep,
  tryMode,
  speak,
  flashScreen,
}: {
  lang: Lang;
  mode: Mode;
  activeStep: number;
  setActiveStep: (value: number | ((current: number) => number)) => void;
  tryMode: (next: Mode) => void;
  speak: (text: string) => void;
  flashScreen: () => void;
}) {
  const tr = (value: Localized) => L(value, lang);
  const selectedStep = journeySteps[activeStep];
  const StepIcon = selectedStep.icon;

  return (
    <section id="journey" className="section section-dark page">
      <div className="container">
        <PageHead title={tr(ui.journeyTitle)} />
        <div className="mode-bar">
          <span className="mode-bar-label">{tr(ui.modeBarLabel)}</span>
          <div className="mode-switch" role="group" aria-label={tr(ui.modeBarLabel)}>
            <button
              type="button"
              className={mode === 'visual' ? 'is-active' : ''}
              aria-pressed={mode === 'visual'}
              onClick={() => tryMode('visual')}
            >
              <Volume2 size={15} aria-hidden="true" />
              {tr(ui.modeVisualShort)}
            </button>
            <button
              type="button"
              className={mode === 'hearing' ? 'is-active' : ''}
              aria-pressed={mode === 'hearing'}
              onClick={() => tryMode('hearing')}
            >
              <Vibrate size={15} aria-hidden="true" />
              {tr(ui.modeHearingShort)}
            </button>
          </div>
        </div>

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
  );
}

function SeatsPage({
  lang,
  mode,
  onSeat,
  selectedSeat,
  seatReadout,
  readSeats,
}: {
  lang: Lang;
  mode: Mode;
  onSeat: (seat: Seat) => void;
  selectedSeat: string | null;
  seatReadout: string;
  readSeats: () => void;
}) {
  const tr = (value: Localized) => L(value, lang);
  const allSeats = seatSections.flatMap((section) => section.seats);
  const availableCount = allSeats.filter((seat) => seat.status === 'available').length;
  const accessibleCount = allSeats.filter((seat) => seat.status === 'accessible').length;

  return (
    <section id="seats" className="section section-tint page">
      <div className="container">
        <PageHead title={tr(ui.seatsTitle)} />
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
            <p className="note">{tr(ui.seatsNote)}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}

function ChatPage({
  lang,
  mode,
  messages,
  thinking,
  chatInput,
  setChatInput,
  sendMessage,
  listening,
  startListening,
  notice,
}: {
  lang: Lang;
  mode: Mode;
  messages: ChatMessage[];
  thinking: boolean;
  chatInput: string;
  setChatInput: (value: string) => void;
  sendMessage: (text: string) => void;
  listening: boolean;
  startListening: () => void;
  notice: string;
}) {
  const tr = (value: Localized) => L(value, lang);
  const lastRiderMessage = messages.filter((message) => message.from === 'rider').slice(-1)[0];

  return (
    <section id="communication" className="section page">
      <div className="container">
        <PageHead title={tr(ui.commTitle)} />
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
            <form className="chat-form" onSubmit={(event) => {
              event.preventDefault();
              sendMessage(chatInput);
            }}>
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
            <div className={`driver-screen ${mode === 'hearing' ? 'is-hearing' : ''}`}>
              <span>BRT 102</span>
              <strong>{tr(ui.commDriver)}</strong>
              <p>{lastRiderMessage?.text ?? tr(ui.commWelcome)}</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function SettingsPage({
  lang,
  mode,
  reduceMotion,
  voiceEnabled,
  hapticsEnabled,
  speechRate,
  preferredLine,
  autoReadPlan,
  resetNotice,
  setLang,
  tryMode,
  setReduceMotion,
  setVoiceEnabled,
  setHapticsEnabled,
  setSpeechRate,
  setPreferredLine,
  setAutoReadPlan,
  speak,
  flashScreen,
  resetSettings,
  showWelcome,
}: {
  lang: Lang;
  mode: Mode;
  reduceMotion: boolean;
  voiceEnabled: boolean;
  hapticsEnabled: boolean;
  speechRate: number;
  preferredLine: PreferredLine;
  autoReadPlan: boolean;
  resetNotice: boolean;
  setLang: (value: Lang) => void;
  tryMode: (next: Mode) => void;
  setReduceMotion: (value: boolean) => void;
  setVoiceEnabled: (value: boolean) => void;
  setHapticsEnabled: (value: boolean) => void;
  setSpeechRate: (value: number) => void;
  setPreferredLine: (value: PreferredLine) => void;
  setAutoReadPlan: (value: boolean) => void;
  speak: (text: string) => void;
  flashScreen: () => void;
  resetSettings: () => void;
  showWelcome: () => void;
}) {
  const tr = (value: Localized) => L(value, lang);

  return (
    <section id="settings" className="section section-tint page">
      <div className="container">
        <PageHead title={tr(ui.settingsTitle)} />
        <div className="settings-grid">
          <article className="settings-card">
            <h2>{tr(ui.settingsLanguage)}</h2>
            <div className="segmented" role="group" aria-label={tr(ui.settingsLanguage)}>
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
          </article>

          <article className="settings-card">
            <h2>{tr(ui.settingsMode)}</h2>
            <div className="segmented" role="group" aria-label={tr(ui.settingsMode)}>
              <button
                type="button"
                className={mode === 'visual' ? 'is-active' : ''}
                aria-pressed={mode === 'visual'}
                onClick={() => tryMode('visual')}
              >
                <Volume2 size={15} aria-hidden="true" />
                {tr(ui.modeVisualShort)}
              </button>
              <button
                type="button"
                className={mode === 'hearing' ? 'is-active' : ''}
                aria-pressed={mode === 'hearing'}
                onClick={() => tryMode('hearing')}
              >
                <Vibrate size={15} aria-hidden="true" />
                {tr(ui.modeHearingShort)}
              </button>
            </div>
          </article>

          <article className="settings-card">
            <h2>{tr(ui.settingsPreferredLine)}</h2>
            <select
              id="preferred-line"
              className="settings-select"
              value={preferredLine}
              onChange={(event) => setPreferredLine(event.target.value as PreferredLine)}
            >
              <option value="none">{tr(ui.settingsLineNone)}</option>
              <option value="BRT 102">BRT 102</option>
              <option value="Amman Bus 101">Amman Bus 101</option>
              <option value="BRT 103">BRT 103</option>
            </select>
          </article>

          <article className="settings-card">
            <h2>{tr(ui.settingsMotion)}</h2>
            <button
              type="button"
              role="switch"
              aria-checked={reduceMotion}
              aria-label={`${tr(ui.settingsMotion)}: ${reduceMotion ? tr(ui.settingsMotionOn) : tr(ui.settingsMotionOff)}`}
              className={`toggle ${reduceMotion ? 'is-on' : ''}`}
              onClick={() => setReduceMotion(!reduceMotion)}
            >
              {reduceMotion ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
              {reduceMotion ? tr(ui.settingsMotionOn) : tr(ui.settingsMotionOff)}
            </button>
          </article>

          <article className="settings-card">
            <h2>{tr(ui.settingsVoice)}</h2>
            <div className="settings-row">
              <button
                type="button"
                role="switch"
                aria-checked={voiceEnabled}
                aria-label={`${tr(ui.settingsVoice)}: ${voiceEnabled ? tr(ui.settingsVoiceOn) : tr(ui.settingsVoiceOff)}`}
                className={`toggle ${voiceEnabled ? 'is-on' : ''}`}
                onClick={() => setVoiceEnabled(!voiceEnabled)}
              >
                {voiceEnabled ? <Volume2 size={15} aria-hidden="true" /> : <Volume2 size={15} opacity={0.4} aria-hidden="true" />}
                {voiceEnabled ? tr(ui.settingsVoiceOn) : tr(ui.settingsVoiceOff)}
              </button>
              <button
                type="button"
                className="btn secondary small"
                onClick={() => speak(tr(ui.modeSample))}
                disabled={!voiceEnabled}
              >
                {tr(ui.settingsTestVoice)}
              </button>
            </div>
            <div className="settings-row">
              <label htmlFor="speech-rate">{tr(ui.settingsSpeechRate)}</label>
              <select
                id="speech-rate"
                className="settings-select"
                value={speechRate}
                disabled={!voiceEnabled}
                onChange={(event) => setSpeechRate(Number(event.target.value))}
              >
                <option value={0.8}>{tr(ui.settingsRateSlow)}</option>
                <option value={0.95}>{tr(ui.settingsRateNormal)}</option>
                <option value={1.1}>{tr(ui.settingsRateFast)}</option>
              </select>
            </div>
          </article>

          <article className="settings-card">
            <h2>{tr(ui.settingsAutoRead)}</h2>
            <button
              type="button"
              role="switch"
              aria-checked={autoReadPlan}
              aria-label={`${tr(ui.settingsAutoRead)}: ${autoReadPlan ? tr(ui.settingsOn) : tr(ui.settingsOff)}`}
              className={`toggle ${autoReadPlan ? 'is-on' : ''}`}
              onClick={() => setAutoReadPlan(!autoReadPlan)}
            >
              <Volume2 size={15} opacity={autoReadPlan ? 1 : 0.4} aria-hidden="true" />
              {autoReadPlan ? tr(ui.settingsOn) : tr(ui.settingsOff)}
            </button>
          </article>

          <article className="settings-card">
            <h2>{tr(ui.settingsHaptics)}</h2>
            <div className="settings-row">
              <button
                type="button"
                role="switch"
                aria-checked={hapticsEnabled}
                aria-label={`${tr(ui.settingsHaptics)}: ${hapticsEnabled ? tr(ui.settingsHapticsOn) : tr(ui.settingsHapticsOff)}`}
                className={`toggle ${hapticsEnabled ? 'is-on' : ''}`}
                onClick={() => setHapticsEnabled(!hapticsEnabled)}
              >
                <Vibrate size={15} aria-hidden="true" />
                {hapticsEnabled ? tr(ui.settingsHapticsOn) : tr(ui.settingsHapticsOff)}
              </button>
              <button type="button" className="btn secondary small" onClick={flashScreen}>
                {tr(ui.settingsTestFlash)}
              </button>
            </div>
          </article>

          <article className="settings-card">
            <h2>{tr(ui.settingsData)}</h2>
            <div className="settings-actions">
              <button type="button" className="btn secondary small" onClick={resetSettings}>
                {tr(ui.settingsReset)}
              </button>
              <button type="button" className="btn secondary small" onClick={showWelcome}>
                {tr(ui.settingsShowWelcome)}
              </button>
            </div>
            {resetNotice ? (
              <p className="note" role="status">{tr(ui.settingsResetDone)}</p>
            ) : null}
          </article>
        </div>
        <p className="note settings-note">{tr(ui.settingsSimNote)}</p>
      </div>
    </section>
  );
}

function App() {
  const [settings, setSettings] = useState<SettingsState>(loadSettings);
  const [onboarded, setOnboarded] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [destination, setDestination] = useState('');
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [planning, setPlanning] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [destinationPoint, setDestinationPoint] = useState<OsmPlace | null>(null);
  const geocodeId = useRef(0);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [seatReadout, setSeatReadout] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState('');
  const [notice, setNotice] = useState('');
  const [resetNotice, setResetNotice] = useState(false);
  const [flash, setFlash] = useState(false);

  const {
    lang,
    mode,
    reduceMotion,
    voiceEnabled,
    hapticsEnabled,
    speechRate,
    preferredLine,
    autoReadPlan,
  } = settings;
  const tr = (value: Localized) => L(value, lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduceMotion);
  }, [reduceMotion]);

  useEffect(() => {
    if (!onboarded) {
      document.title = `${L(ui.welcomeTitle, lang)} — Wasel A.I.`;
    }
  }, [onboarded, lang]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Settings stay in memory when storage is unavailable.
    }
  }, [settings]);

  const update = (patch: Partial<SettingsState>) => {
    setSettings((current) => ({ ...current, ...patch }));
  };

  const setLang = (next: Lang) => update({ lang: next });
  const setReduceMotion = (value: boolean) => update({ reduceMotion: value });
  const setVoiceEnabled = (value: boolean) => update({ voiceEnabled: value });
  const setHapticsEnabled = (value: boolean) => update({ hapticsEnabled: value });
  const setSpeechRate = (value: number) => update({ speechRate: value });
  const setPreferredLine = (value: PreferredLine) => update({ preferredLine: value });
  const setAutoReadPlan = (value: boolean) => update({ autoReadPlan: value });

  const speak = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    if (synth.paused) synth.resume();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ar' ? 'ar-JO' : 'en-US';
    utterance.rate = speechRate;
    const preferred = synth
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith(lang === 'ar' ? 'ar' : 'en'));
    if (preferred) utterance.voice = preferred;
    synth.speak(utterance);
  };

  const flashScreen = () => {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 900);
    if (hapticsEnabled) {
      const nav = navigator as Navigator & { vibrate?: (pattern: number[]) => boolean };
      nav.vibrate?.([80, 50, 80]);
    }
  };

  const tryMode = (next: Mode) => {
    update({ mode: next });
    if (next === 'visual') speak(tr(ui.modeSample));
    else flashScreen();
  };

  const chooseMode = (next: Mode) => {
    update({
      mode: next,
      ...(next === 'visual' ? { voiceEnabled: true } : {}),
    });
    setOnboarded(true);
    if (next === 'visual') speak(tr(ui.welcomeVisualSample));
    else flashScreen();
  };

  const showWelcome = () => {
    setOnboarded(false);
    window.scrollTo(0, 0);
  };

  const tripSummary = (results: TripOption[]) => {
    const optionLabel = lang === 'ar' ? 'الخيار' : 'Option';
    const intro =
      lang === 'ar'
        ? `وجدت ${results.length} خيارات.`
        : `I found ${results.length} options.`;
    const parts = results.map((trip, index) => {
      const seatsText =
        trip.seats != null
          ? `${trip.seats} ${tr(ui.planSeats)}`
          : tr(ui.planStanding);
      return `${optionLabel} ${index + 1}. ${trip.line}. ${tr(ui.planNext)} ${trip.next} ${tr(ui.minutesShort)}. ${seatsText}.`;
    });
    return `${intro} ${parts.join(' ')} ${tr(ui.voiceChooseBus)}`;
  };

  const planTrip = (value?: string) => {
    const dest = (value ?? destination).trim() || tr(ui.planDefault);
    setDestination(dest);
    setPlanning(true);
    setTrips([]);
    setSelectedTripId(null);
    setDestinationPoint(localPlace(dest));

    const requestId = geocodeId.current + 1;
    geocodeId.current = requestId;
    void geocodeDestination(dest, lang).then((point) => {
      if (requestId === geocodeId.current) setDestinationPoint(point);
    });

    window.setTimeout(() => {
      const results = getTrips(dest, lang);
      if (preferredLine !== 'none') {
        results.sort((a, b) =>
          a.line === preferredLine ? -1 : b.line === preferredLine ? 1 : 0,
        );
      }
      setTrips(results);
      setPlanning(false);
      if ((mode === 'visual' || autoReadPlan) && voiceEnabled) {
        speak(tripSummary(results));
      }
    }, 450);
  };

  const onPlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    planTrip();
  };

  const selectTrip = (trip: TripOption) => {
    setSelectedTripId(trip.id);
    if (mode === 'visual') {
      const seatsText =
        trip.seats != null
          ? `${trip.seats} ${tr(ui.planSeats)}`
          : tr(ui.planStanding);
      speak(`${tr(ui.voiceSelected)} ${trip.line}. ${seatsText}.`);
    }
    window.setTimeout(() => {
      document.getElementById('trip-detail')?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 80);
  };

  const chooseTripByVoice = (transcript: string) => {
    const value = transcript.toLowerCase();
    let index = -1;

    if (/(first|one|1|الأول|الاول|واحد)/.test(value)) index = 0;
    else if (/(second|two|2|الثاني|الثانى|اثنين|اثنان)/.test(value)) index = 1;
    else if (/(third|three|3|الثالث|ثلاثة|ثلاثه)/.test(value)) index = 2;

    if (index < 0) {
      const numbers = value.match(/\d{3}/g);
      if (numbers) {
        index = trips.findIndex((trip) =>
          numbers.some((number) => trip.line.includes(number)),
        );
      }
    }

    if (index < 0) {
      index = trips.findIndex((trip) => value.includes(trip.line.toLowerCase()));
    }

    const chosen = trips[index];
    if (chosen) {
      selectTrip(chosen);
      setVoiceNotice(`${tr(ui.voiceSelected)} ${chosen.line}`);
    } else {
      const message = tr(ui.voiceChoiceRetry);
      setVoiceNotice(message);
      speak(message);
    }
  };

  const startVoice = () => {
    if (voiceListening) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setVoiceNotice('');

    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      const message = tr(ui.commMicUnsupported);
      setVoiceNotice(message);
      return;
    }

    const choosing = trips.length > 0;

    try {
      const recognition = new Recognition();
      recognition.lang = lang === 'ar' ? 'ar-JO' : 'en-US';
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim();
        if (!transcript) {
          const message = tr(ui.voiceNoInput);
          setVoiceNotice(message);
          speak(message);
          return;
        }
        setVoiceNotice(`${tr(ui.voiceHeard)} ${transcript}`);
        if (choosing) {
          chooseTripByVoice(transcript);
        } else {
          setDestination(transcript);
          planTrip(transcript);
        }
      };
      recognition.onend = () => setVoiceListening(false);
      recognition.onerror = () => {
        setVoiceListening(false);
        setVoiceNotice(tr(ui.voiceMicError));
      };
      recognition.start();
      setVoiceListening(true);
    } catch {
      setVoiceListening(false);
      setVoiceNotice(tr(ui.voiceMicError));
    }
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

  const startListening = () => {
    const Recognition = getSpeechRecognition();
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

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setResetNotice(true);
    try {
      localStorage.removeItem(SETTINGS_KEY);
    } catch {
      // Ignore storage failures.
    }
    window.setTimeout(() => setResetNotice(false), 3000);
  };

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) ?? null;
  const selectedTripSeats = selectedTrip ? seatsForTrip(selectedTrip) : [];

  if (!onboarded) {
    return (
      <>
        <div className={`flash-overlay ${flash ? 'is-flashing' : ''}`} aria-hidden="true" />
        <WelcomePage lang={lang} setLang={setLang} onChoose={chooseMode} />
      </>
    );
  }

  return (
    <>
      <RouteEffects lang={lang} />
      <button
        type="button"
        className="skip-link"
        onClick={() => {
          const main = document.getElementById('main');
          main?.focus();
          main?.scrollIntoView();
        }}
      >
        {tr(ui.skip)}
      </button>
      <div className={`flash-overlay ${flash ? 'is-flashing' : ''}`} aria-hidden="true" />

      <header className="site-header">
        <div className="container header-inner">
          <NavLink className="brand" to="/" end aria-label="Wasel A.I.">
            <span className="brand-mark">
              <Bus size={21} aria-hidden="true" />
            </span>
            <span className="brand-copy">
              <strong dir="ltr">WASEL A.I.</strong>
              <small>{tr(ui.brandTag)}</small>
            </span>
          </NavLink>
          <nav className="nav" aria-label={lang === 'ar' ? 'التنقل' : 'Navigation'}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => (isActive ? 'is-active' : '')}
              >
                {L(item.label, lang)}
              </NavLink>
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
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <Routes>
          <Route
            path="/"
            element={
              <PlanPage
                lang={lang}
                mode={mode}
                destination={destination}
                setDestination={setDestination}
                onPlan={onPlan}
                planning={planning}
                trips={trips}
                planTrip={planTrip}
                selectedTrip={selectedTrip}
                selectedTripSeats={selectedTripSeats}
                onSelectTrip={selectTrip}
                onSeat={onSeat}
                destinationPoint={destinationPoint}
                voiceListening={voiceListening}
                voiceNotice={voiceNotice}
                onVoice={startVoice}
              />
            }
          />
          <Route
            path="/trip"
            element={
              <TripPage
                lang={lang}
                mode={mode}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                tryMode={tryMode}
                speak={speak}
                flashScreen={flashScreen}
              />
            }
          />
          <Route
            path="/seats"
            element={
              <SeatsPage
                lang={lang}
                mode={mode}
                onSeat={onSeat}
                selectedSeat={selectedSeat}
                seatReadout={seatReadout}
                readSeats={readSeats}
              />
            }
          />
          <Route
            path="/chat"
            element={
              <ChatPage
                lang={lang}
                mode={mode}
                messages={messages}
                thinking={thinking}
                chatInput={chatInput}
                setChatInput={setChatInput}
                sendMessage={sendMessage}
                listening={listening}
                startListening={startListening}
                notice={notice}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsPage
                lang={lang}
                mode={mode}
                reduceMotion={reduceMotion}
                voiceEnabled={voiceEnabled}
                hapticsEnabled={hapticsEnabled}
                speechRate={speechRate}
                preferredLine={preferredLine}
                autoReadPlan={autoReadPlan}
                resetNotice={resetNotice}
                setLang={setLang}
                tryMode={tryMode}
                setReduceMotion={setReduceMotion}
                setVoiceEnabled={setVoiceEnabled}
                setHapticsEnabled={setHapticsEnabled}
                setSpeechRate={setSpeechRate}
                setPreferredLine={setPreferredLine}
                setAutoReadPlan={setAutoReadPlan}
                speak={speak}
                flashScreen={flashScreen}
                resetSettings={resetSettings}
                showWelcome={showWelcome}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="container footer-min">
          <NavLink className="brand footer-brand" to="/" end>
            <span className="brand-mark"><Bus size={20} aria-hidden="true" /></span>
            <span className="brand-copy"><strong dir="ltr">WASEL A.I.</strong><small>{tr(ui.brandTag)}</small></span>
          </NavLink>
          <p>{tr(ui.footerDisclaimer)}</p>
          <p className="footer-rights">
            © 2026 <bdi dir="ltr">Wasel A.I.</bdi> — {tr(ui.footerAllRights)}
          </p>
        </div>
      </footer>
    </>
  );
}

export default App;
