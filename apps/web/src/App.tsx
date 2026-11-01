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
  Clock,
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
  searchPlaces,
  type OsmPlace,
} from './osm';

type ChatMessage = {
  from: 'rider' | 'driver';
  text: string;
};

type PreferredLine = 'none' | 'BRT 102' | 'Amman Bus 101' | 'BRT 103';
type TtsVoice = 'ar-JO-SanaNeural' | 'ar-JO-TaimNeural' | 'browser';

type SettingsState = {
  lang: Lang;
  mode: Mode;
  reduceMotion: boolean;
  voiceEnabled: boolean;
  hapticsEnabled: boolean;
  speechRate: number;
  preferredLine: PreferredLine;
  autoReadPlan: boolean;
  ttsVoice: TtsVoice;
  handsFree: boolean;
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
  ttsVoice: 'ar-JO-SanaNeural',
  handsFree: true,
};

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    const preferredLines: PreferredLine[] = ['none', 'BRT 102', 'Amman Bus 101', 'BRT 103'];
    const ttsVoices: TtsVoice[] = ['ar-JO-SanaNeural', 'ar-JO-TaimNeural', 'browser'];
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
      ttsVoice:
        parsed.ttsVoice && ttsVoices.includes(parsed.ttsVoice)
          ? parsed.ttsVoice
          : 'ar-JO-SanaNeural',
      handsFree: parsed.handsFree !== false,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const pageTitles: Record<string, Localized> = {
  '/': ui.planTitle,
  '/trip': ui.journeyTitle,
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

type SpeechAlternative = {
  transcript?: string;
  confidence?: number;
};

type SpeechResult = Array<SpeechAlternative> & { isFinal?: boolean };

type SpeechResultEvent = {
  resultIndex?: number;
  results?: ArrayLike<SpeechResult>;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous?: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop?: () => void;
  abort?: () => void;
};

type SpeakOptions = {
  bargeIn?: boolean;
  autoListen?: boolean;
  stage?: 'destination' | 'confirm' | 'choice';
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const speechWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function normalizeVoiceText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[إأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[،,.!?؟:;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isYes(value: string): boolean {
  return /(^|\s)(نعم|ايوه|ايوا|اجل|صح|تمام|اوكي|اوك|yes|ok|okay)(\s|$)/.test(value);
}

function isNo(value: string): boolean {
  return /(^|\s)(لا|كلا|مش|no|nope)(\s|$)/.test(value);
}

function isRepeat(value: string): boolean {
  return /(اعد|عيد|كرر|مره ثانيه|مرة ثانية|repeat|again)/.test(value);
}

function isChangeDestination(value: string): boolean {
  return /(غير الوجهه|وجهه جديده|وجهة جديدة|غير المكان|change destination|new destination)/.test(value);
}

function isStop(value: string): boolean {
  return /(توقف|اوقف|اسكت|الغاء|الغي|stop|cancel|quiet)/.test(value);
}

function parseSpokenIndex(value: string): number | null {
  if (/(^|\s)(1|one|first|الاول|اول|واحد)(\s|$)/.test(value)) return 0;
  if (/(^|\s)(2|two|second|الثاني|الثانى|ثاني|اثنين|اثنان)(\s|$)/.test(value)) return 1;
  if (/(^|\s)(3|three|third|الثالث|ثالث|ثلاثه|ثلاثة)(\s|$)/.test(value)) return 2;
  return null;
}

function isEchoOf(heard: string, spoken: string): boolean {
  const said = normalizeVoiceText(heard).split(' ').filter(Boolean);
  if (said.length < 2) return false;
  const spokenWords = new Set(normalizeVoiceText(spoken).split(' ').filter(Boolean));
  const overlap = said.filter((word) => spokenWords.has(word)).length / said.length;
  return overlap >= 0.5;
}

function pickBrowserVoice(voices: SpeechSynthesisVoice[], lang: Lang): SpeechSynthesisVoice | undefined {
  const target = lang === 'ar' ? 'ar' : 'en';
  return voices
    .filter((voice) => voice.lang.toLowerCase().startsWith(target))
    .sort((a, b) => {
      const score = (voice: SpeechSynthesisVoice) => {
        const name = voice.name.toLowerCase();
        let value = 0;
        if (/natural|neural|enhanced|premium|online/.test(name)) value += 100;
        if (voice.lang.toLowerCase().startsWith('ar-jo')) value += 40;
        if (/maged|sana|taim|hamed|amany|laila|zeina|salma/.test(name)) value += 20;
        if (!voice.localService) value += 10;
        return value;
      };
      return score(b) - score(a);
    })[0];
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
  number,
  selected,
  onSelect,
}: {
  trip: TripOption;
  lang: Lang;
  number: number;
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
          <span className="trip-option-number">{number}</span>
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
  voiceIssue,
  voiceInterim,
  voiceCandidates,
  voicePrompt,
  voiceSearching,
  onVoice,
  onReadOptions,
  onChooseCandidate,
  onResetDestination,
  onRepeatVoice,
  onStopVoice,
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
  voiceIssue: string;
  voiceInterim: string;
  voiceCandidates: OsmPlace[];
  voicePrompt: string;
  voiceSearching: boolean;
  onVoice: () => void;
  onReadOptions: () => void;
  onChooseCandidate: (place: OsmPlace) => void;
  onResetDestination: () => void;
  onRepeatVoice: () => void;
  onStopVoice: () => void;
}) {
  const tr = (value: Localized) => L(value, lang);
  const confirmMode = voiceCandidates.length > 0;
  const panelLabel = voiceSearching
    ? tr(ui.voiceSearching)
    : voiceListening
      ? confirmMode
        ? tr(ui.voiceListeningPlace)
        : trips.length > 0
          ? tr(ui.voiceListeningChoice)
          : tr(ui.voiceListening)
      : confirmMode
        ? tr(ui.voiceConfirmListening)
        : trips.length > 0
          ? tr(ui.voiceAskChoice)
          : tr(ui.voiceTapDestination);
  const panelHint = confirmMode
    ? tr(ui.voiceCandidatesHint)
    : trips.length > 0
      ? tr(ui.voiceChooseHint)
      : tr(ui.voiceDestinationHint);
  const selectedArrival = selectedTrip
    ? new Intl.DateTimeFormat(lang === 'ar' ? 'ar-JO' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(selectedTrip.arrivalAt))
    : '';
  const selectedMinutes = selectedTrip
    ? selectedTrip.next === 1
      ? tr(ui.voiceMinute)
      : tr(ui.voiceMinutes)
    : '';

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
              disabled={voiceListening || voiceSearching}
              aria-label={panelLabel}
            >
              <span className="voice-orb">
                {voiceListening || voiceSearching ? <span className="voice-wave" aria-hidden="true" /> : <Mic size={26} aria-hidden="true" />}
              </span>
              <span className="voice-copy">
                <strong>{panelLabel}</strong>
                <small>{panelHint}</small>
              </span>
            </button>

            {voiceIssue ? (
              <p className="voice-warning" role="status">
                <span aria-hidden="true">!</span>
                {voiceIssue}
              </p>
            ) : null}

            {voiceListening && voiceInterim ? (
              <p className="voice-live" role="status">
                {tr(ui.voiceHeard)} {voiceInterim}
              </p>
            ) : null}

            {voiceCandidates.length > 0 ? (
              <div className="voice-confirm">
                <p className="voice-confirm-title">{voicePrompt}</p>
                <div className="voice-candidates">
                  {voiceCandidates.slice(0, 3).map((place, index) => (
                    <button
                      type="button"
                      className="voice-candidate"
                      key={`${place.lat}-${place.lon}-${place.label}`}
                      onClick={() => onChooseCandidate(place)}
                    >
                      <span className="voice-candidate-index">{index + 1}</span>
                      <span className="voice-candidate-copy">
                        <strong>{place.label}</strong>
                        {place.address && place.address !== place.label ? (
                          <small>{place.address}</small>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="voice-actions">
                  <button
                    type="button"
                    className="btn primary small"
                    onClick={() => onChooseCandidate(voiceCandidates[0])}
                  >
                    {tr(ui.voiceYes)}
                  </button>
                  <button type="button" className="btn secondary small" onClick={onResetDestination}>
                    {tr(ui.voiceChange)}
                  </button>
                  <button type="button" className="btn secondary small" onClick={onRepeatVoice}>
                    {tr(ui.voiceRepeat)}
                  </button>
                  <button type="button" className="btn secondary small" onClick={onStopVoice}>
                    {tr(ui.voiceStop)}
                  </button>
                </div>
              </div>
            ) : null}

            {voiceNotice ? (
              <p className="note voice-notice" role="status">{voiceNotice}</p>
            ) : null}

            {trips.length > 0 && voiceCandidates.length === 0 ? (
              <div className="voice-actions">
                <button type="button" className="btn secondary small" onClick={onReadOptions}>
                  <Volume2 size={15} aria-hidden="true" />
                  {tr(ui.voiceReadOptions)}
                </button>
                <button type="button" className="btn secondary small" onClick={onResetDestination}>
                  {tr(ui.voiceChange)}
                </button>
                <button type="button" className="btn secondary small" onClick={onStopVoice}>
                  {tr(ui.voiceStop)}
                </button>
              </div>
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
              {mode === 'visual' ? (
                <p className="voice-choice-question">
                  {tr(ui.voiceAskChoice)} <span>{tr(ui.voiceChooseHint)}</span>
                </p>
              ) : null}
              <div className="trip-grid" aria-label={tr(ui.planAria)}>
                {trips.map((trip, index) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    lang={lang}
                    number={index + 1}
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
                  <p className="trip-detail-arrival">
                    <Clock size={15} aria-hidden="true" />
                    {tr(ui.voiceArrivesIn)} {selectedTrip.next} {selectedMinutes} · {tr(ui.planArrive)}: {selectedArrival}
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
  ttsVoice,
  handsFree,
  resetNotice,
  setLang,
  tryMode,
  setReduceMotion,
  setVoiceEnabled,
  setHapticsEnabled,
  setSpeechRate,
  setPreferredLine,
  setAutoReadPlan,
  setTtsVoice,
  setHandsFree,
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
  ttsVoice: TtsVoice;
  handsFree: boolean;
  resetNotice: boolean;
  setLang: (value: Lang) => void;
  tryMode: (next: Mode) => void;
  setReduceMotion: (value: boolean) => void;
  setVoiceEnabled: (value: boolean) => void;
  setHapticsEnabled: (value: boolean) => void;
  setSpeechRate: (value: number) => void;
  setPreferredLine: (value: PreferredLine) => void;
  setAutoReadPlan: (value: boolean) => void;
  setTtsVoice: (value: TtsVoice) => void;
  setHandsFree: (value: boolean) => void;
  speak: (text: string, options?: { bargeIn?: boolean; autoListen?: boolean; stage?: 'destination' | 'confirm' | 'choice' }) => void;
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
            <div className="settings-row">
              <label htmlFor="assistant-voice">{tr(ui.settingsAssistantVoice)}</label>
              <select
                id="assistant-voice"
                className="settings-select"
                value={ttsVoice}
                disabled={!voiceEnabled}
                onChange={(event) => setTtsVoice(event.target.value as TtsVoice)}
              >
                <option value="ar-JO-SanaNeural">{tr(ui.settingsVoiceSana)}</option>
                <option value="ar-JO-TaimNeural">{tr(ui.settingsVoiceTaim)}</option>
                <option value="browser">{tr(ui.settingsVoiceBrowser)}</option>
              </select>
            </div>
            <div className="settings-row">
              <span className="settings-row-label">{tr(ui.settingsHandsFree)}</span>
              <button
                type="button"
                role="switch"
                aria-checked={handsFree}
                aria-label={`${tr(ui.settingsHandsFree)}: ${handsFree ? tr(ui.settingsOn) : tr(ui.settingsOff)}`}
                className={`toggle ${handsFree ? 'is-on' : ''}`}
                onClick={() => setHandsFree(!handsFree)}
              >
                <Mic size={15} aria-hidden="true" />
                {handsFree ? tr(ui.settingsOn) : tr(ui.settingsOff)}
              </button>
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState('');
  const [voiceInterim, setVoiceInterim] = useState('');
  const [voiceCandidates, setVoiceCandidates] = useState<OsmPlace[]>([]);
  const [voicePrompt, setVoicePrompt] = useState('');
  const [voiceSearching, setVoiceSearching] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const bargeRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startVoiceRef = useRef<() => void>(() => {});
  const handleVoiceTranscriptRef = useRef<
    (transcript: string, confidence: number | undefined, stage: 'destination' | 'confirm' | 'choice') => void
  >(() => {});
  const speechRunId = useRef(0);
  const voiceSearchId = useRef(0);
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
    ttsVoice,
    handsFree,
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
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    const update = () => setVoices(synth.getVoices());
    update();
    synth.onvoiceschanged = update;
    return () => {
      synth.onvoiceschanged = null;
    };
  }, []);

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
  const setTtsVoice = (value: TtsVoice) => update({ ttsVoice: value });
  const setHandsFree = (value: boolean) => update({ handsFree: value });

  const stopAudioAndSpeech = () => {
    speechRunId.current += 1;
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      try {
        audioRef.current.currentTime = 0;
      } catch {
        // Some browsers do not allow seeking before metadata.
      }
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    try {
      bargeRecognitionRef.current?.abort?.();
      recognitionRef.current?.abort?.();
    } catch {
      // Ignore recognition shutdown errors.
    }
    bargeRecognitionRef.current = null;
    recognitionRef.current = null;
    setVoiceListening(false);
  };

  const speakBrowser = (
    text: string,
    finish: () => void,
    runId: number,
    options: SpeakOptions,
  ) => {
    if (!('speechSynthesis' in window)) {
      finish();
      return;
    }
    const synth = window.speechSynthesis;
    if (synth.paused) synth.resume();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ar' ? 'ar-JO' : 'en-US';
    utterance.rate = speechRate;
    const best = pickBrowserVoice(synth.getVoices(), lang);
    if (best) utterance.voice = best;
    utterance.onstart = () => {
      if (options.bargeIn && handsFree) {
        startBargeIn(text, options.stage ?? 'destination', runId);
      }
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    synth.speak(utterance);
  };

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari =
    /Safari/i.test(navigator.userAgent) &&
    !/Chrome|CriOS|Chromium|Edg|OPR|Firefox|FxiOS/i.test(navigator.userAgent);
  const canBargeIn = !isIOS && !isSafari;

  const startBargeIn = (
    spoken: string,
    stage: 'destination' | 'confirm' | 'choice',
    runId: number,
  ) => {
    if (!handsFree || !canBargeIn) return;
    const Recognition = getSpeechRecognition();
    if (!Recognition) return;
    try {
      bargeRecognitionRef.current?.abort?.();
    } catch {
      // Ignore previous barge-in shutdown errors.
    }

    const recognition = new Recognition();
    bargeRecognitionRef.current = recognition;
    recognition.lang = lang === 'ar' ? 'ar-JO' : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      if (runId !== speechRunId.current) return;
      const result = event.results?.[event.results.length - 1] ?? event.results?.[0];
      const alternative = result?.[0];
      const transcript = alternative?.transcript?.trim();
      if (!transcript || isEchoOf(transcript, spoken)) return;

      const value = normalizeVoiceText(transcript);
      const spokenValue = normalizeVoiceText(spoken);
      if (
        value.split(' ').length < 3 &&
        spokenValue.includes(value)
      ) {
        return;
      }
      const command =
        isStop(value) ||
        isRepeat(value) ||
        isYes(value) ||
        isNo(value) ||
        isChangeDestination(value) ||
        parseSpokenIndex(value) !== null ||
        /\d{3}/.test(value);
      const isFinal = result?.isFinal !== false;
      const destinationWord = Boolean(localPlace(transcript, lang));

      if (!command && (!isFinal || (value.split(' ').length < 2 && !destinationWord))) {
        return;
      }

      speechRunId.current += 1;
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      try {
        recognition.abort?.();
      } catch {
        // Ignore abort errors.
      }
      bargeRecognitionRef.current = null;
      handleVoiceTranscriptRef.current(transcript, alternative?.confidence, stage);
    };

    recognition.onend = () => {
      if (bargeRecognitionRef.current !== recognition) return;
      bargeRecognitionRef.current = null;
      if (runId !== speechRunId.current) return;
      const stillSpeaking = audioRef.current
        ? !audioRef.current.paused && !audioRef.current.ended
        : 'speechSynthesis' in window && window.speechSynthesis.speaking;
      if (stillSpeaking) {
        window.setTimeout(() => startBargeIn(spoken, stage, runId), 250);
      }
    };

    recognition.onerror = () => {
      if (bargeRecognitionRef.current === recognition) {
        bargeRecognitionRef.current = null;
      }
    };

    try {
      recognition.start();
    } catch {
      bargeRecognitionRef.current = null;
    }
  };

  const speak = (text: string, options: SpeakOptions = {}) => {
    if (!voiceEnabled) return;
    stopAudioAndSpeech();
    const runId = speechRunId.current;

    const finish = () => {
      if (runId !== speechRunId.current) return;
      try {
        bargeRecognitionRef.current?.abort?.();
      } catch {
        // Ignore barge-in shutdown errors.
      }
      bargeRecognitionRef.current = null;
      if (options.autoListen && handsFree && mode === 'visual') {
        window.setTimeout(() => {
          if (runId === speechRunId.current) startVoiceRef.current();
        }, 600);
      }
    };

    if (ttsVoice !== 'browser' && typeof Audio !== 'undefined') {
      let audio = audioRef.current;
      if (!audio) {
        audio = document.createElement('audio');
        audio.preload = 'auto';
        audio.style.display = 'none';
        document.body.appendChild(audio);
        audioRef.current = audio;
      }

      const url = `/api/tts?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(ttsVoice)}&rate=${speechRate}`;
      audio.onplay = () => {
        if (options.bargeIn && handsFree) {
          startBargeIn(text, options.stage ?? 'destination', runId);
        }
      };
      audio.onended = () => {
        finish();
      };
      audio.onerror = () => {
        if (runId !== speechRunId.current) return;
        speakBrowser(text, finish, runId, options);
      };
      audio.src = url;
      audio.volume = 1;
      void audio.play().catch(() => {
        if (runId !== speechRunId.current) return;
        speakBrowser(text, finish, runId, options);
      });
    } else {
      speakBrowser(text, finish, runId, options);
    }
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
    update({
      mode: next,
      ...(next === 'visual' ? { voiceEnabled: true } : {}),
    });
    if (next === 'visual') speak(tr(ui.modeSample));
    else flashScreen();
  };

  const chooseMode = (next: Mode) => {
    update({
      mode: next,
      ...(next === 'visual' ? { voiceEnabled: true } : {}),
    });
    setOnboarded(true);
    if (next === 'visual') {
      speak(tr(ui.welcomeVisualSample), {
        bargeIn: true,
        autoListen: true,
        stage: 'destination',
      });
    } else {
      flashScreen();
    }
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
      const minutes = trip.next === 1 ? tr(ui.voiceMinute) : tr(ui.voiceMinutes);
      return `${optionLabel} ${index + 1}. ${trip.line}. ${tr(ui.voiceArrivesIn)} ${trip.next} ${minutes}. ${seatsText}.`;
    });
    return `${intro} ${parts.join(' ')} ${tr(ui.voiceAskChoice)} ${tr(ui.voiceChooseBus)}`;
  };

  const planTrip = (value?: string, point?: OsmPlace | null) => {
    const dest = (value ?? destination).trim() || tr(ui.planDefault);
    voiceSearchId.current += 1;
    setVoiceCandidates([]);
    setVoicePrompt('');
    setVoiceSearching(false);
    setVoiceInterim('');
    setDestination(dest);
    setPlanning(true);
    setTrips([]);
    setSelectedTripId(null);
    setDestinationPoint(point ?? localPlace(dest, lang));

    if (!point) {
      const requestId = geocodeId.current + 1;
      geocodeId.current = requestId;
      void geocodeDestination(dest, lang).then((found) => {
        if (requestId === geocodeId.current) setDestinationPoint(found);
      });
    }

    window.setTimeout(() => {
      const results = getTrips(dest, lang);
      if (preferredLine !== 'none') {
        results.sort((a, b) =>
          a.line === preferredLine ? -1 : b.line === preferredLine ? 1 : 0,
        );
      }
      const summary = tripSummary(results);
      setTrips(results);
      setPlanning(false);
      setVoicePrompt(summary);
      if ((mode === 'visual' || autoReadPlan) && voiceEnabled) {
        speak(summary, {
          bargeIn: true,
          autoListen: true,
          stage: 'choice',
        });
      }
    }, 450);
  };

  const onPlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    planTrip();
  };

  const selectTrip = (trip: TripOption) => {
    setSelectedTripId(trip.id);
    const seatsText =
      trip.seats != null
        ? `${trip.seats} ${tr(ui.planSeats)}`
        : tr(ui.planStanding);
    const minutes = trip.next === 1 ? tr(ui.voiceMinute) : tr(ui.voiceMinutes);
    const arrivalText = `${tr(ui.voiceArrivesIn)} ${trip.next} ${minutes}`;
    setVoiceNotice(`${tr(ui.voiceSelected)} ${trip.line}. ${arrivalText}.`);
    if (mode === 'visual') {
      speak(`${tr(ui.voiceSelected)} ${trip.line}. ${arrivalText}. ${seatsText}.`);
    }
    window.setTimeout(() => {
      document.getElementById('trip-detail')?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 80);
  };

  const chooseTripByVoice = (transcript: string) => {
    const value = normalizeVoiceText(transcript);

    if (/(اسرع|fastest)/.test(value)) {
      const fastest = [...trips].sort(
        (a, b) => a.next + a.ride - (b.next + b.ride),
      )[0];
      if (fastest) {
        selectTrip(fastest);
        return;
      }
    }

    if (/(اقرب|closest)/.test(value)) {
      const closest = [...trips].sort((a, b) => a.walk - b.walk)[0];
      if (closest) {
        selectTrip(closest);
        return;
      }
    }

    if (/(اكثر|most)/.test(value) && /(مقاعد|seats)/.test(value)) {
      const mostSeats = [...trips].sort((a, b) => (b.seats ?? -1) - (a.seats ?? -1))[0];
      if (mostSeats) {
        selectTrip(mostSeats);
        return;
      }
    }

    let index = parseSpokenIndex(value) ?? -1;

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
    } else {
      const message = tr(ui.voiceChoiceRetry);
      setVoiceNotice(message);
      speak(message, {
        bargeIn: true,
        autoListen: true,
        stage: 'choice',
      });
    }
  };

  const chooseVoiceCandidate = (place: OsmPlace) => {
    setVoiceCandidates([]);
    setVoicePrompt('');
    setVoiceSearching(false);
    setVoiceInterim('');
    setVoiceNotice('');
    setSelectedTripId(null);
    setDestination(place.label);
    planTrip(place.label, place);
  };

  const resetVoiceDestination = () => {
    stopAudioAndSpeech();
    voiceSearchId.current += 1;
    setVoiceCandidates([]);
    setVoicePrompt('');
    setVoiceSearching(false);
    setVoiceInterim('');
    setVoiceListening(false);
    setVoiceNotice('');
    setTrips([]);
    setSelectedTripId(null);
    setDestinationPoint(null);
    setDestination('');
    setPlanning(false);
    window.setTimeout(() => document.getElementById('destination')?.focus(), 50);
    speak(tr(ui.planTitle), {
      bargeIn: true,
      autoListen: true,
      stage: 'destination',
    });
  };

  const stopVoice = () => {
    stopAudioAndSpeech();
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // Ignore recognition shutdown errors.
    }
    recognitionRef.current = null;
    voiceSearchId.current += 1;
    setVoiceListening(false);
    setVoiceSearching(false);
    setVoiceInterim('');
    setVoiceNotice(tr(ui.voiceStopped));
  };

  const repeatVoice = () => {
    const text =
      voicePrompt ||
      (trips.length > 0 ? tripSummary(trips) : tr(ui.voiceTapDestination));
    setVoiceNotice(text);
    speak(text, {
      bargeIn: true,
      autoListen: true,
      stage: voiceCandidates.length
        ? 'confirm'
        : trips.length > 0
          ? 'choice'
          : 'destination',
    });
  };

  const searchVoiceDestination = (transcript: string, confidence?: number) => {
    const clean = transcript.trim();
    if (!clean) {
      const message = tr(ui.voiceNoInput);
      setVoiceNotice(message);
      speak(message, {
        bargeIn: true,
        autoListen: true,
        stage: 'destination',
      });
      return;
    }

    const value = normalizeVoiceText(clean);
    if (isStop(value)) {
      stopVoice();
      return;
    }
    if (isRepeat(value)) {
      speak(tr(ui.voiceTapDestination), {
        bargeIn: true,
        autoListen: true,
        stage: 'destination',
      });
      return;
    }
    if (
      typeof confidence === 'number' &&
      confidence > 0 &&
      confidence < 0.45 &&
      !localPlace(clean, lang)
    ) {
      const message = tr(ui.voiceLowConfidence);
      setVoiceNotice(message);
      speak(message, {
        bargeIn: true,
        autoListen: true,
        stage: 'destination',
      });
      return;
    }

    setDestination(clean);
    setVoiceCandidates([]);
    setVoicePrompt('');
    setVoiceSearching(true);
    setVoiceNotice(tr(ui.voiceSearching));

    const requestId = voiceSearchId.current + 1;
    voiceSearchId.current = requestId;

    void searchPlaces(clean, lang).then((places) => {
      if (requestId !== voiceSearchId.current) return;
      setVoiceSearching(false);

      if (!places.length) {
        const message = tr(ui.voiceNoPlaces);
        setVoiceNotice(message);
        speak(message, {
          bargeIn: true,
          autoListen: true,
          stage: 'destination',
        });
        return;
      }

      const top = places.slice(0, 3);
      const prompt =
        top.length === 1
          ? `${tr(ui.voiceConfirmPrompt)} ${top[0].label}؟`
          : `${tr(ui.voiceCandidatesTitle)}: ${top
              .map((place, index) => `${index + 1}. ${place.label}`)
              .join('. ')}. ${tr(ui.voiceConfirmListening)}`;

      setVoiceCandidates(top);
      setVoicePrompt(prompt);
      setVoiceNotice('');
      speak(prompt, {
        bargeIn: true,
        autoListen: true,
        stage: 'confirm',
      });
    });
  };

  const handleVoiceTranscript = (
    transcript: string,
    confidence: number | undefined,
    stage: 'destination' | 'confirm' | 'choice',
  ) => {
    const value = normalizeVoiceText(transcript);

    if (isStop(value)) {
      stopVoice();
      return;
    }

    if (stage === 'confirm') {
      if (isRepeat(value)) {
        repeatVoice();
        return;
      }
      if (isYes(value)) {
        const first = voiceCandidates[0];
        if (first) chooseVoiceCandidate(first);
        return;
      }
      if (isNo(value) || isChangeDestination(value)) {
        resetVoiceDestination();
        return;
      }
      const index = parseSpokenIndex(value);
      if (index !== null && voiceCandidates[index]) {
        chooseVoiceCandidate(voiceCandidates[index]);
        return;
      }
      searchVoiceDestination(transcript, confidence);
      return;
    }

    if (stage === 'choice') {
      if (isRepeat(value)) {
        repeatVoice();
        return;
      }
      if (isChangeDestination(value) || isNo(value)) {
        resetVoiceDestination();
        return;
      }
      chooseTripByVoice(transcript);
      return;
    }

    searchVoiceDestination(transcript, confidence);
  };

  const startVoice = () => {
    if (voiceListening || voiceSearching) return;
    stopAudioAndSpeech();
    setVoiceNotice('');
    setVoiceInterim('');

    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      const message = tr(ui.commMicUnsupported);
      setVoiceNotice(message);
      return;
    }

    const stage: 'destination' | 'confirm' | 'choice' = voiceCandidates.length
      ? 'confirm'
      : trips.length > 0
        ? 'choice'
        : 'destination';

    try {
      const recognition = new Recognition();
      recognitionRef.current = recognition;
      recognition.lang = lang === 'ar' ? 'ar-JO' : 'en-US';
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        const result = event.results?.[0];
        const alternative = result?.[0];
        const transcript = alternative?.transcript?.trim();

        if (!transcript) {
          if (result?.isFinal) {
            const message = tr(ui.voiceNoInput);
            setVoiceNotice(message);
            speak(message, {
              bargeIn: true,
              autoListen: true,
              stage,
            });
          }
          return;
        }

        setVoiceInterim(transcript);
        if (stage === 'destination') setDestination(transcript);
        if (result?.isFinal === false) return;

        setVoiceInterim('');
        handleVoiceTranscript(transcript, alternative?.confidence, stage);
      };
      recognition.onend = () => {
        setVoiceListening(false);
        recognitionRef.current = null;
      };
      recognition.onerror = () => {
        setVoiceListening(false);
        recognitionRef.current = null;
        setVoiceNotice(tr(ui.voiceMicError));
      };
      recognition.start();
      setVoiceListening(true);
    } catch {
      setVoiceListening(false);
      recognitionRef.current = null;
      setVoiceNotice(tr(ui.voiceMicError));
    }
  };

  useEffect(() => {
    handleVoiceTranscriptRef.current = handleVoiceTranscript;
    startVoiceRef.current = startVoice;
  });

  const onSeat = (seat: Seat) => {
    const status =
      seat.status === 'available'
        ? tr(ui.seatsAvailable)
        : seat.status === 'accessible'
          ? tr(ui.seatsAccessible)
          : tr(ui.seatsOccupied);
    const text = `${seat.id} — ${status}`;
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

  const micSupported = Boolean(getSpeechRecognition());
  const speechSupported = ttsVoice !== 'browser' || 'speechSynthesis' in window;
  const hasArabicVoice = voices.some((voice) =>
    voice.lang.toLowerCase().startsWith('ar'),
  );
  const voiceIssue = !voiceEnabled
    ? tr(ui.voiceDisabled)
    : !window.isSecureContext
      ? tr(ui.voiceNeedsSecure)
      : !micSupported
        ? tr(ui.voiceUnsupportedBrowser)
        : !speechSupported
          ? tr(ui.voiceTtsUnsupported)
          : ttsVoice === 'browser' && voices.length > 0 && !hasArabicVoice
            ? tr(ui.voiceNoArabic)
            : '';

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
                voiceIssue={voiceIssue}
                voiceInterim={voiceInterim}
                voiceCandidates={voiceCandidates}
                voicePrompt={voicePrompt}
                voiceSearching={voiceSearching}
                onVoice={startVoice}
                onReadOptions={() =>
                  speak(tripSummary(trips), {
                    bargeIn: true,
                    autoListen: true,
                    stage: 'choice',
                  })
                }
                onChooseCandidate={chooseVoiceCandidate}
                onResetDestination={resetVoiceDestination}
                onRepeatVoice={repeatVoice}
                onStopVoice={stopVoice}
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
                ttsVoice={ttsVoice}
                handsFree={handsFree}
                resetNotice={resetNotice}
                setLang={setLang}
                tryMode={tryMode}
                setReduceMotion={setReduceMotion}
                setVoiceEnabled={setVoiceEnabled}
                setHapticsEnabled={setHapticsEnabled}
                setSpeechRate={setSpeechRate}
                setPreferredLine={setPreferredLine}
                setAutoReadPlan={setAutoReadPlan}
                setTtsVoice={setTtsVoice}
                setHandsFree={setHandsFree}
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
