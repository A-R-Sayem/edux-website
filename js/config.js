/**
 * EduX — central configuration
 * ------------------------------------------------------------------
 * This is the ONE file the founders edit for day-to-day changes:
 * contact details, social links, courses, subjects, batches, founders,
 * and the Google Apps Script endpoint.
 *
 * Anything left empty ('' / [] / null) is treated as "not provided yet"
 * and the website shows a neutral "Contact us for details" message
 * instead of inventing information.
 *
 * Paths are written relative to the project root (e.g. 'assets/images/...').
 * The site adds the correct "../" prefix automatically on pages in /pages.
 */
window.EDUX_CONFIG = {
  // ---------------------------------------------------------------
  // BRAND
  // ---------------------------------------------------------------
  brand: {
    name: 'EduX',
    tagline: 'Education, reimagined for the next generation.',
    // Leave '' to render the wordmark as text ("Edu" white + "X" blue).
    // If you have a logo file, put it in assets/images and set e.g.
    // logoImage: 'assets/images/edux-logo.png'
    logoImage: '',
    favicon: 'assets/icons/favicon.svg',
  },

  // ---------------------------------------------------------------
  // NAVIGATION (used by the header and footer on every page)
  // ---------------------------------------------------------------
  nav: [
    { label: 'Home', href: 'index.html' },
    { label: 'About Us', href: 'pages/about.html' },
    { label: 'Courses', href: 'pages/courses.html' },
    { label: 'Our Founders', href: 'index.html#founders' },
    { label: 'Contact', href: 'index.html#contact' },
  ],
  enrollHref: 'pages/enroll.html',

  // ---------------------------------------------------------------
  // CONTACT & LOCATION
  // ---------------------------------------------------------------
  contact: {
    address: 'Near Bashpata Restaurant, Putijury, Bahubal, Habiganj, Bangladesh',
    // Fill these in when you have them. Empty = not shown.
    phone: '', // e.g. '+8801XXXXXXXXX'
    whatsapp: '', // e.g. '8801XXXXXXXXX' (digits only, with country code)
    email: '',
    // This is a Google Maps SEARCH link built from the address text.
    // It is NOT a verified pin. For an exact pin: open Google Maps, find
    // the centre, press Share -> Copy link, and paste it here.
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=Bashpata%20Restaurant%20Putijury%20Bahubal%20Habiganj',
    mapLabel: 'Find us on Google Maps',
  },

  // Empty string = hidden. Full URLs only (https://...).
  social: {
    facebook: '',
    instagram: '',
    youtube: '',
    tiktok: '',
  },

  // ---------------------------------------------------------------
  // ENROLLMENT
  // ---------------------------------------------------------------
  enrollment: {
    // Paste the Web App URL from Apps Script here (ends with /exec).
    // While this is empty the form validates but cannot submit, and
    // shows a friendly "contact us directly" message.
    endpoint: 'https://script.google.com/macros/s/AKfycbwZBqbW7Bzmu3x-i1KIdZYHTfInCGPMHvjWI-t6kiNmOt22fcTMGKDVKus5i2PmRqZa0w/exec',
    requestTimeoutMs: 20000,
    // The enrollment form shows these. Keep in sync with backend/Code.gs
    // (see README "Keeping the website and backend in sync").
    messageMaxLength: 500,
  },

  // ---------------------------------------------------------------
  // CLASSES / PROGRAMS
  // ---------------------------------------------------------------
  // To add a class: copy one block, change id/value/title, set enabled: true.
  // To hide a class: set enabled: false (Classes 6-8 are ready but OFF).
  //
  // value   -> the exact text stored in Google Sheets. Must match backend/Code.gs
  // subjects-> [] until confirmed. Example: ['Mathematics', 'Physics']
  // batches -> [] until confirmed. Example: [{ value: 'morning', label: 'Morning (8-10 AM)' }]
  // schedule / fee -> null until confirmed (shows "Contact us for details")
  classes: [
    {
      id: 'class-9',
      value: 'Class 9',
      level: 'Class 9',
      badge: 'Academic Program',
      title: 'Class 9 Academic Program',
      description:
        'Build strong fundamentals early. Concept-focused lessons that prepare students for the SSC journey ahead.',
      subjects: [],
      batches: [],
      schedule: null,
      fee: null,
      enabled: true,
    },
    {
      id: 'class-10',
      value: 'Class 10',
      level: 'Class 10',
      badge: 'SSC Preparation',
      title: 'Class 10 SSC Preparation Program',
      description:
        'Structured SSC preparation that focuses on understanding concepts, practising problems, and building exam confidence.',
      subjects: [],
      batches: [],
      schedule: null,
      fee: null,
      enabled: true,
    },
    // ---- Future classes: switch on by setting enabled: true ----
    { id: 'class-8', value: 'Class 8', level: 'Class 8', badge: 'Academic Program', title: 'Class 8 Academic Program', description: 'Coming later.', subjects: [], batches: [], schedule: null, fee: null, enabled: false },
    { id: 'class-7', value: 'Class 7', level: 'Class 7', badge: 'Academic Program', title: 'Class 7 Academic Program', description: 'Coming later.', subjects: [], batches: [], schedule: null, fee: null, enabled: false },
    { id: 'class-6', value: 'Class 6', level: 'Class 6', badge: 'Academic Program', title: 'Class 6 Academic Program', description: 'Coming later.', subjects: [], batches: [], schedule: null, fee: null, enabled: false },
  ],

  // ---------------------------------------------------------------
  // FOUNDERS / INSTRUCTORS
  // ---------------------------------------------------------------
  // To add an instructor: copy a block and add a photo to assets/images.
  founders: [
    {
      id: 'sayem',
      name: 'MD Azadur Rahman Sayem',
      fieldLabel: 'Department',
      field: 'Computer Science and Engineering (CSE)',
      institution: 'Bangladesh University of Engineering and Technology (BUET)',
      credential: '',
      photo: 'assets/images/founder-sayem.jpg',
      alt: 'Portrait of MD Azadur Rahman Sayem, EduX co-founder',
    },
    {
      id: 'sanim',
      name: 'Nur Uddin Akhanjee Sanim',
      fieldLabel: 'Department',
      field: 'Electrical and Electronic Engineering (EEE)',
      institution: 'Shahjalal University of Science and Technology (SUST)',
      credential: '',
      photo: 'assets/images/founder-sanim.jpg',
      alt: 'Portrait of Nur Uddin Akhanjee Sanim, EduX co-founder',
    },
    {
      id: 'jihad',
      name: 'Jannatul Ferdaus Jihad',
      fieldLabel: 'Subject',
      field: 'Physics',
      institution: 'Murarichand College',
      credential: 'IELTS Band 7.0',
      photo: 'assets/images/founder-jihad.jpg',
      alt: 'Portrait of Jannatul Ferdaus Jihad, EduX co-founder',
    },
  ],

  // ---------------------------------------------------------------
  // "WHY EDUX" CARDS (educational approach — not achievement claims)
  // ---------------------------------------------------------------
  why: [
    { icon: 'bulb', title: 'Concept-Based Learning', text: 'Understand the logic behind every answer.' },
    { icon: 'layers', title: 'Strong Fundamentals', text: 'Build the foundation needed for academic excellence.' },
    { icon: 'route', title: 'Structured Preparation', text: 'Learn through an organized study plan.' },
    { icon: 'compass', title: 'Student-Focused Guidance', text: "Get guidance designed around students' learning needs." },
    { icon: 'rocket', title: 'Future-Ready Education', text: 'Develop confidence and independent problem-solving skills.' },
  ],

  // ---------------------------------------------------------------
  // LEARNING PHILOSOPHY STEPS
  // ---------------------------------------------------------------
  philosophy: [
    { step: '01', title: 'Understand', text: 'Start with the idea behind the topic, not the answer to memorize.' },
    { step: '02', title: 'Practice', text: 'Apply each concept through problems until it feels natural.' },
    { step: '03', title: 'Gain confidence', text: 'Turn clear understanding into calm, confident preparation.' },
  ],
};
