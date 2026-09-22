// Prototype fixtures for homepage result sections. Competition discovery uses the public API.
export const mockLiveLeaders = [
  { place: 1, name: "Louise Peeters", club: "VAC", result: "7.31" },
  { place: 2, name: "Noor Claes", club: "RCG", result: "7.38" },
  { place: 3, name: "Sofie Aerts", club: "LYRA", result: "7.42" },
] as const;

export const mockLatestResults = [
  {
    date: "2027-05-18",
    title: "Brussels Indoor",
    organization: "CABW",
    winner: "Louise Peeters",
    event: "Women · 60 m",
    mark: "7.31",
  },
  {
    date: "2027-05-17",
    title: "Liège Throws",
    organization: "RFCL",
    winner: "Thomas Diallo",
    event: "Men · Shot put",
    mark: "17.42 m",
  },
  {
    date: "2027-05-11",
    title: "Ghent Spring Meet",
    organization: "KAAG",
    winner: "Amélie Dubois",
    event: "Women · 800 m",
    mark: "2:04.18",
  },
] as const;
