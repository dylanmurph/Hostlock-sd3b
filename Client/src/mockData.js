// ----- ADMIN -----
export const adminHosts = [
  {
    id: 1,
    name: "John Host",
    email: "john.host@example.com",
    phone: "+353 85 123 4567",
    status: "Active",
    propertiesCount: 3,
    activeGuests: 5,
    joinedDate: "2025-01-10",
  },
  {
    id: 2,
    name: "Mary Property",
    email: "mary.property@example.com",
    phone: "+353 86 987 6543",
    status: "Inactive",
    propertiesCount: 1,
    activeGuests: 0,
    joinedDate: "2024-11-05",
  },
];

export const adminProperties = [
  {
    id: 1,
    name: "Dundalk Apartment",
    hostId: 1,
    hostName: "John Host",
    activeGuests: 2,
    nfcDevices: 3,
    cameras: 2,
    status: "Active",
  },
  {
    id: 2,
    name: "Beach House",
    hostId: 1,
    hostName: "John Host",
    activeGuests: 3,
    nfcDevices: 4,
    cameras: 3,
    status: "Active",
  },
  {
    id: 3,
    name: "City Studio",
    hostId: 2,
    hostName: "Mary Property",
    activeGuests: 0,
    nfcDevices: 1,
    cameras: 1,
    status: "Inactive",
  },
];

// ----- GUEST -----
export const guestAlerts = [
  {
    id: 1,
    message: "Your host updated check-in instructions",
    time: "2 hours ago",
    type: "info", // "info" | "error" | "reminder"
    status: "Pending", // "Pending" | "Resolved"
  },
  {
    id: 2,
    message: "Wi-Fi password changed",
    time: "Yesterday",
    type: "reminder",
    status: "Resolved",
  },
];

// ----- HOST -----
export const hostAlerts = [
  {
    id: 1,
    message: "New guest checked in",
    time: "Just now",
    type: "info",
    status: "Unread",
  },
  {
    id: 2,
    message: "Door battery low at Dundalk Apartment",
    time: "3 hours ago",
    type: "warning",
    status: "Unread",
  },
];

export const accessLogs = [
  {
    id: 1,
    timestamp: "2025-11-20 15:01",
    guestName: "Emily Clark",
    door: "Lobby Door",
    method: "NFC",
    status: "Success",
  },
  {
    id: 2,
    timestamp: "2025-11-20 15:03",
    guestName: "Emily Clark",
    door: "Apartment Door",
    method: "NFC",
    status: "Success",
  },
  {
    id: 3,
    timestamp: "2025-11-19 21:17",
    guestName: "System",
    door: "Lobby Door",
    method: "NFC",
    status: "Failed",
  },
];