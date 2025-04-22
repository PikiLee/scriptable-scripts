export interface ITeamLink {
  isExternal: boolean;
  rel: string[];
  href: string;
  text: string;
  isPremium: boolean;
}

export interface ITeamVenue {
  id: string;
}

export interface ITeam {
  alternateColor: string;
  venue: ITeamVenue;
  color: string;
  displayName: string;
  abbreviation: string;
  isActive: boolean;
  shortDisplayName: string;
  uid: string;
  name: string;
  logo: string;
  location: string;
  links: ITeamLink[];
  id: string;
}

export interface IRecord {
  summary: string;
  name: string;
  abbreviation?: string; // Added optional based on example
  type: string;
}

export interface ILeaderAthleteLink {
  rel: string[];
  href: string;
}

export interface ILeaderAthletePosition {
  abbreviation: string;
}

export interface ILeaderAthleteTeam {
  id: string;
}

export interface ILeaderAthlete {
  displayName: string;
  headshot: string;
  jersey: string;
  fullName: string;
  active: boolean;
  links: ILeaderAthleteLink[];
  id: string;
  position: ILeaderAthletePosition | string; // Position can be object or string
  team: ILeaderAthleteTeam;
  shortName: string;
}

export interface ILeaderEntry {
  displayValue: string;
  athlete: ILeaderAthlete;
  team: ILeaderAthleteTeam;
  value: number;
}

export interface ILeader {
  shortDisplayName: string;
  displayName: string;
  name: string;
  leaders: ILeaderEntry[];
  abbreviation: string;
}

export interface ILinescore {
  value: number;
}

export interface IStatistic {
  displayValue: string;
  name: string;
  abbreviation: string;
}

export interface ICompetitor {
  records: IRecord[];
  leaders?: ILeader[]; // Optional based on example
  team: ITeam;
  type: string;
  uid: string;
  homeAway: 'home' | 'away';
  score?: string; // Optional based on example
  winner?: boolean; // Optional based on example
  record?: string; // Optional based on example (overall record in series?)
  id: string;
  linescores?: ILinescore[]; // Optional based on example
  order: number;
  statistics?: IStatistic[]; // Optional based on example
}

export interface IVenueAddress {
  city: string;
  state: string;
}

export interface IVenue {
  address: IVenueAddress;
  fullName: string;
  indoor: boolean;
  id: string;
}

export interface INote {
  type: string;
  headline: string;
}

export interface IGeoBroadcastMarket {
  id: string;
  type: string;
}

export interface IGeoBroadcastMedia {
  shortName: string;
}

export interface IGeoBroadcastType {
  id: string;
  shortName: string;
}

export interface IGeoBroadcast {
  market: IGeoBroadcastMarket;
  media: IGeoBroadcastMedia;
  type: IGeoBroadcastType;
  lang: string;
  region: string;
}

export interface IFormatRegulation {
  periods: number;
}

export interface IFormat {
  regulation: IFormatRegulation;
}

export interface IBroadcast {
  market: string;
  names: string[];
}

export interface ICompetitionType {
  id: string;
  abbreviation: string;
}

export interface IHighlightAd {
  sport: string;
  bundle: string;
}

export interface IHighlightTimeRestrictions {
  embargoDate: string;
  expirationDate: string;
}

export interface IHighlightGeoRestrictions {
  countries: string[];
  type: string;
}

export interface IHighlightTracking {
  leagueName: string;
  trackingName: string;
  coverageType: string;
  sportName: string;
  trackingId: string;
}

export interface IHighlightDeviceRestrictions {
  devices: string[];
  type: string;
}

// Simplified link structure for highlights
export interface IHighlightLink {
  href: string;
}

export interface IHighlightLinks {
  sportscenter: IHighlightLink;
  web: {
    self: IHighlightLink & { dsi?: IHighlightLink }; // Added optional dsi
    href: string;
    seo?: IHighlightLink; // Added optional seo
  };
  mobile: {
    streaming: IHighlightLink;
    alert: IHighlightLink;
    progressiveDownload: IHighlightLink;
    href: string;
    source: IHighlightLink;
  };
  api: {
    self: IHighlightLink;
    artwork: IHighlightLink;
  };
  source: {
    mezzanine: IHighlightLink;
    hds: IHighlightLink;
    href: string;
    HD: IHighlightLink;
    HLS: {
      cmaf: IHighlightLink;
      href: string;
      HD: IHighlightLink;
    };
    flash: IHighlightLink;
    full: IHighlightLink;
  };
}

export interface IHighlight {
  cerebroId: string;
  thumbnail: string;
  ad: IHighlightAd;
  timeRestrictions: IHighlightTimeRestrictions;
  description: string;
  geoRestrictions: IHighlightGeoRestrictions;
  source: string;
  tracking: IHighlightTracking;
  duration: number;
  deviceRestrictions: IHighlightDeviceRestrictions;
  originalPublishDate: string;
  links: IHighlightLinks;
  id: number; // Changed to number based on example
  lastModified: string;
  headline: string;
}

export interface ISeriesCompetitor {
  wins: number;
  uid: string;
  ties: number;
  id: string;
  href: string;
}

export interface ISeries {
  summary: string;
  competitors: ISeriesCompetitor[];
  totalCompetitions: number;
  completed: boolean;
  type: string;
  title: string;
}

// HeadlineVideo reuses many structures from Highlight
export interface IHeadlineVideo {
  duration: number;
  deviceRestrictions: IHighlightDeviceRestrictions;
  thumbnail: string;
  geoRestrictions: IHighlightGeoRestrictions;
  links: IHighlightLinks;
  id: number; // Changed to number based on example
  source: string;
  headline: string;
  tracking: IHighlightTracking;
}

export interface IHeadline {
  description: string;
  video?: IHeadlineVideo[]; // Optional based on example
  type: string;
  shortLinkText: string;
}

export interface IStatusType {
  name: string;
  description: string;
  id: string;
  state: 'pre' | 'in' | 'post';
  completed: boolean;
  detail: string;
  shortDetail: string;
}

export interface IStatus {
  period: number;
  displayClock: string;
  clock: number;
  type: IStatusType;
}

export interface ISituationAthlete {
  displayName: string;
  headshot: string;
  jersey: string;
  fullName: string;
  links: ILeaderAthleteLink[]; // Reusing existing link type
  id: string;
  position: string; // Simplified as string
  team: ILeaderAthleteTeam; // Reusing existing team type
  shortName: string;
}

export interface ISituationProbability {
  homeWinPercentage: number;
  awayWinPercentage: number;
  tiePercentage: number;
}

export interface ISituationLastPlayType {
    id: string;
    text: string;
}

export interface ISituationLastPlay {
  athletesInvolved: ISituationAthlete[];
  probability: ISituationProbability;
  id: string;
  text: string;
  team: ILeaderAthleteTeam; // Reusing existing team type
  type: ISituationLastPlayType;
  scoreValue: number;
}

export interface ISituation {
  lastPlay: ISituationLastPlay;
  // Add other potential fields if needed
}

export interface ICompetition {
  date: string;
  broadcast?: string; // Optional based on example
  venue: IVenue;
  conferenceCompetition: boolean;
  notes: INote[];
  timeValid: boolean;
  geoBroadcasts: IGeoBroadcast[];
  format: IFormat;
  broadcasts: IBroadcast[];
  playByPlayAvailable: boolean;
  type: ICompetitionType;
  uid: string;
  competitors: ICompetitor[];
  highlights: IHighlight[];
  series?: ISeries; // Optional based on example
  headlines?: IHeadline[]; // Optional based on example
  id: string;
  neutralSite: boolean;
  recent: boolean;
  attendance: number;
  startDate: string;
  status: IStatus;
  situation?: ISituation; // Optional based on example
}

export interface ISeason {
  year: number;
  type: number;
  slug: string;
}

export interface IGameLink {
  isExternal: boolean;
  shortText: string;
  rel: string[];
  language: string;
  href: string;
  text: string;
  isPremium: boolean;
}

export interface IGame {
  date: string;
  uid: string;
  name: string;
  competitions: ICompetition[];
  season: ISeason;
  links: IGameLink[];
  id: string;
  shortName: string;
  status: IStatus;
}

export interface ISeasonObj {
  year: number;
  type: number;
}

export interface IDaySchedule {
  calendar: string[];
  leagueName: string;
  calendartype: string;
  leagues: any[]; // Type could be refined if structure is known
  games: IGame[];
  seasonObj: ISeasonObj;
  apiDate: string;
}

// Root response structure using an index signature for the date key
export interface IScheduleResponse {
  content: {
    schedule: {
      [date: string]: IDaySchedule;
    };
    // Add other potential top-level fields if they exist
  };
} 